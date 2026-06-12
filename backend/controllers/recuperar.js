import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import Usuario from "../models/usuario.js";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODIGO_REGEX = /^\d{6}$/;
const MENSAJE_GENERICO = "Si el correo está registrado, recibirás un código de verificación";

function crearTransporte() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Faltan EMAIL_USER o EMAIL_PASS para enviar correos");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function normalizarEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function construirCorreoRecuperacion(usuario, codigo) {
  return {
    from: `"CoffePrice" <${process.env.EMAIL_USER}>`,
    to: usuario.email,
    subject: "Código de recuperación - CoffePrice",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #3D1F0F; margin: 0;">CoffePrice</h2>
        </div>
        <h3 style="color: #333;">Recuperación de contraseña</h3>
        <p>Hola <strong>${usuario.nombre || "caficultor"}</strong>,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Tu código de verificación es:</p>
        <div style="background: #FFF8EC; border: 2px solid #C8814A; padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
          <h1 style="color: #3B1F0A; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: monospace;">${codigo}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">Este código expira en <strong>15 minutos</strong>.</p>
        <p style="color: #999; font-size: 12px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
      </div>
    `,
  };
}

function construirCorreoConfirmacion(usuario) {
  const frontendUrl = process.env.FRONTEND_URL || "";

  return {
    from: `"CoffePrice" <${process.env.EMAIL_USER}>`,
    to: usuario.email,
    subject: "Contraseña actualizada - CoffePrice",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #3D1F0F; margin: 0;">Contraseña actualizada</h2>
        </div>
        <p>Hola <strong>${usuario.nombre || "caficultor"}</strong>,</p>
        <p>Tu contraseña ha sido actualizada exitosamente.</p>
        <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
        ${frontendUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/login" style="background: #7A4020; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Iniciar sesión</a>
          </div>
        ` : ""}
        <p style="color:#dc2626; font-size: 14px;">Si no realizaste este cambio, contacta a soporte inmediatamente.</p>
      </div>
    `,
  };
}

let enviarCorreoActual = async (mailOptions) => {
  const transporte = crearTransporte();
  await transporte.sendMail(mailOptions);
};

export function __setEnviarCorreoRecuperacionForTests(fn) {
  enviarCorreoActual = fn || (async (mailOptions) => {
    const transporte = crearTransporte();
    await transporte.sendMail(mailOptions);
  });
}

export const solicitarCodigo = async (req, res) => {
  try {
    const emailNormalizado = normalizarEmail(req.body?.email);

    if (!emailNormalizado) {
      return res.status(400).json({ message: "El correo electrónico es obligatorio" });
    }

    if (!EMAIL_REGEX.test(emailNormalizado)) {
      return res.status(400).json({ message: "Correo electrónico no válido" });
    }

    const usuarioEncontrado = await Usuario.findOne({ email: emailNormalizado });
    if (!usuarioEncontrado || !usuarioEncontrado.password) {
      return res.status(200).json({ message: MENSAJE_GENERICO });
    }

    const codigo = generarCodigo();
    usuarioEncontrado.codigoRecuperacion = await bcrypt.hash(codigo, 10);
    usuarioEncontrado.codigoExpiracion = new Date(Date.now() + 15 * 60 * 1000);
    await usuarioEncontrado.save();

    await enviarCorreoActual(construirCorreoRecuperacion(usuarioEncontrado, codigo));

    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Código de recuperación enviado a: ${usuarioEncontrado.email}`);
    }

    return res.status(200).json({ message: MENSAJE_GENERICO });
  } catch (error) {
    console.error("Error al enviar el código de recuperación:", error);
    return res.status(500).json({ message: "Error al procesar la solicitud" });
  }
};

export const cambiarPassword = async (req, res) => {
  try {
    const emailNormalizado = normalizarEmail(req.body?.email);
    const codigo = String(req.body?.codigo || "").trim();
    const nuevaPassword = String(req.body?.nuevaPassword || "");

    if (!emailNormalizado || !codigo || !nuevaPassword) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    if (!EMAIL_REGEX.test(emailNormalizado)) {
      return res.status(400).json({ message: "Correo electrónico no válido" });
    }

    if (!CODIGO_REGEX.test(codigo)) {
      return res.status(400).json({ message: "Código inválido o expirado" });
    }

    if (!PASSWORD_REGEX.test(nuevaPassword)) {
      return res.status(400).json({
        message: "La contraseña debe tener mínimo 10 caracteres, una mayúscula, una minúscula y un número",
      });
    }

    const usuarioEncontrado = await Usuario.findOne({ email: emailNormalizado });
    if (!usuarioEncontrado || !usuarioEncontrado.codigoRecuperacion || !usuarioEncontrado.codigoExpiracion) {
      return res.status(400).json({ message: "Código inválido o expirado" });
    }

    if (usuarioEncontrado.codigoExpiracion < new Date()) {
      usuarioEncontrado.codigoRecuperacion = null;
      usuarioEncontrado.codigoExpiracion = null;
      await usuarioEncontrado.save();
      return res.status(400).json({ message: "Código inválido o expirado" });
    }

    const codigoValido = await bcrypt.compare(codigo, usuarioEncontrado.codigoRecuperacion);
    if (!codigoValido) {
      return res.status(400).json({ message: "Código inválido o expirado" });
    }

    usuarioEncontrado.password = await bcrypt.hash(nuevaPassword, 10);
    usuarioEncontrado.codigoRecuperacion = null;
    usuarioEncontrado.codigoExpiracion = null;
    await usuarioEncontrado.save();

    await enviarCorreoActual(construirCorreoConfirmacion(usuarioEncontrado));

    return res.status(200).json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    return res.status(500).json({ message: "Error al cambiar contraseña" });
  }
};
