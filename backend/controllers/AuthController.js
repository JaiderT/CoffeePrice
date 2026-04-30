import Usuario from "../models/usuario.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function construirSesionUsuario(usuario) {
  return {
    id: usuario._id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    rol: usuario.rol,
    celular: usuario.celular,
  };
}

function generarToken(usuario, expiresIn = process.env.JWT_EXPIRES_IN || "7d") {
  return jwt.sign(
    { id: usuario._id, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

function fijarCookieAuth(res, token, maxAge = 7 * 24 * 60 * 60 * 1000) {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: '/',
    maxAge,
  });
}

async function enviarCodigoVerificacion(email, nombre, codigo) {
  await transporter.sendMail({
    from: `"support.coffeprice@gmail.com" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verifica tu cuenta de CoffePrice",
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; background: #FAF7F2; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #3D1F0F, #7A4020); padding: 32px; text-align: center;">
          <span style="font-size: 2rem;">☕</span>
          <h1 style="color: #FAF7F2; margin: 8px 0 0; font-size: 1.6rem;">CoffePrice</h1>
        </div>
        <div style="padding: 36px 32px;">
          <h2 style="color: #3B1F0A; margin: 0 0 8px;">Hola, ${nombre}</h2>
          <p style="color: #666; font-size: 0.95rem; line-height: 1.6; margin: 0 0 28px;">
            Usa este codigo para verificar tu cuenta. Expira en <strong>10 minutos</strong>.
          </p>
          <div style="background: white; border: 2px solid #C8814A; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
            <span style="font-size: 2.8rem; font-weight: 900; letter-spacing: 12px; color: #3B1F0A;">
              ${codigo}
            </span>
          </div>
          <p style="color: #999; font-size: 0.8rem; text-align: center; margin: 0;">
            Si no creaste esta cuenta, puedes ignorar este correo.
          </p>
        </div>
      </div>
    `,
  });
}

export const register = async (req, res) => {
  try {
    const { nombre, apellido, email, password, celular, rol } = req.body;

    if (!nombre || !apellido || !email || !password || !rol) {
      return res.status(400).json({
        message: "Nombre, apellido, correo, contraseña y rol son obligatorios",
      });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const rolesPermitidos = ["productor", "comprador"];

    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({ message: "Rol no válido" });
    }

    if (!EMAIL_REGEX.test(emailNormalizado)) {
      return res.status(400).json({ message: "Correo electrónico no válido" });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message: "La contraseña debe tener mínimo 10 caracteres, una mayúscula, una minúscula y un número",
      });
    }

    const existeUsuario = await Usuario.findOne({ email: emailNormalizado });
    if (existeUsuario) {
      if (existeUsuario.codigoVerificacion) {
        const codigoPendiente = Math.floor(100000 + Math.random() * 900000).toString();
        existeUsuario.codigoVerificacion = codigoPendiente;
        existeUsuario.codigoVerificacionExpira = new Date(Date.now() + 10 * 60 * 1000);
        await existeUsuario.save();
        await enviarCodigoVerificacion(emailNormalizado, existeUsuario.nombre, codigoPendiente);
        return res.status(200).json({
          message: "Ya existe una cuenta pendiente. Te reenviamos el código de verificación.",
        });
      }
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + 10 * 60 * 1000);

    const newUsuario = new Usuario({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: emailNormalizado,
      password: hashedPassword,
      celular,
      rol,
      estado: "pendiente",
      codigoVerificacion: codigo,
      codigoVerificacionExpira: expiracion,
    });

    await newUsuario.save();
    await enviarCodigoVerificacion(emailNormalizado, nombre.trim(), codigo);

    res.status(201).json({ message: "Código de verificación enviado al correo." });
  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const verifyEmailCodigo = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Correo y código son obligatorios" });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const usuario = await Usuario.findOne({ email: emailNormalizado });

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (usuario.estado === "activo") {
      return res.status(400).json({ message: "El correo ya fue verificado" });
    }

    if (!usuario.codigoVerificacion || !usuario.codigoVerificacionExpira) {
      return res.status(400).json({ message: "No hay código pendiente. Solicita uno nuevo." });
    }

    if (new Date() > usuario.codigoVerificacionExpira) {
      return res.status(400).json({ message: "El código expiró. Solicita uno nuevo." });
    }

    if (usuario.codigoVerificacion !== code.trim()) {
      return res.status(400).json({ message: "Código incorrecto" });
    }

    usuario.codigoVerificacion = null;
    usuario.codigoVerificacionExpira = null;

    if (usuario.rol === "comprador") {
      await usuario.save();
      return res.status(200).json({
        message: "Correo verificado. Tu cuenta será revisada por un administrador.",
        pendiente: true,
      });
    }

    usuario.estado = "activo";
    usuario.ultimaConexion = new Date();
    await usuario.save();

    const token = generarToken(usuario);
    fijarCookieAuth(res, token);

    res.status(200).json({
      message: "Correo verificado exitosamente",
      pendiente: false,
      user: construirSesionUsuario(usuario),
      role: usuario.rol,
      name: usuario.nombre,
      apellido: usuario.apellido,
      id: usuario._id,
      celular: usuario.celular,
      email: usuario.email,
    });
  } catch (error) {
    console.error("Error en verifyEmailCodigo:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "El correo es obligatorio" });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const usuario = await Usuario.findOne({ email: emailNormalizado });

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (usuario.estado === "activo") {
      return res.status(400).json({ message: "El correo ya fue verificado" });
    }

    const tiempoRestante = usuario.codigoVerificacionExpira
      ? usuario.codigoVerificacionExpira - Date.now()
      : 0;

    if (tiempoRestante > 9 * 60 * 1000) {
      return res.status(429).json({
        message: "Espera un momento antes de solicitar otro código",
      });
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + 10 * 60 * 1000);

    usuario.codigoVerificacion = codigo;
    usuario.codigoVerificacionExpira = expiracion;
    await usuario.save();

    await enviarCodigoVerificacion(emailNormalizado, usuario.nombre, codigo);

    res.status(200).json({ message: "Código reenviado exitosamente" });
  } catch (error) {
    console.error("Error en resendVerification:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Correo y contraseña son obligatorios" });
    }

    const emailNormalizado = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(emailNormalizado)) {
      return res.status(400).json({ message: "Correo electrónico no válido" });
    }

    const user = await Usuario.findOne({ email: emailNormalizado });
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "Esta cuenta usa Google. Inicia sesión con Google.",
      });
    }

    if (user.estado === "eliminado") {
      return res.status(403).json({
        message: "Esta cuenta ha sido eliminada. Si crees que es un error, contacta al administrador.",
      });
    }

    if (user.estado === "suspendido") {
      return res.status(403).json({
        message: "Tu cuenta está suspendida. Contacta al administrador para reactivarla.",
      });
    }

    if (user.estado === "pendiente") {
      return res.status(403).json({
        message: "Debes verificar tu correo electrónico antes de iniciar sesión.",
      });
    }

    if (user.estado === "rechazado") {
      return res.status(403).json({
        message: "Tu cuenta ha sido rechazada. Contacta al administrador.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    await Usuario.findByIdAndUpdate(user._id, { ultimaConexion: new Date() });

    const token = generarToken(user);
    fijarCookieAuth(res, token);

    res.status(200).json({
      user: construirSesionUsuario(user),
      role: user.rol,
      name: user.nombre,
      apellido: user.apellido,
      id: user._id,
      celular: user.celular,
      email: user.email,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const googleCallback = (req, res) => {
  try {
    if (req.user.estado === "rechazado") {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=cuenta_rechazada`
      );
    }
    if (req.user.estado === "eliminado") {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=cuenta_eliminada`
      );
    }
    if (req.user.estado === "suspendido") {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=cuenta_suspendida`
      );
    }
    const token = generarToken(req.user);
    fijarCookieAuth(res, token);
    if (req.user.estado === "pendiente") {
      return res.redirect(
        `${process.env.FRONTEND_URL}/completar-perfil`
      );
    }
    res.redirect(`${process.env.FRONTEND_URL}/auth/google`);
  } catch (error) {
    res.redirect(
      `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
    );
  }
};
