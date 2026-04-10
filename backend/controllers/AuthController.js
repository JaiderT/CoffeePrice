// controllers/AuthController.js
import Usuario from "../models/usuario.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { enviarCorreoVerificacion, enviarCorreoBienvenida } from "./emailService.js";

export const register = async (req, res) => {
  try {
    const { nombre, apellido, email, password, celular, rol } = req.body;

    if (!nombre || !apellido || !email || !password || !rol) {
      return res.status(400).json({
        message: "Nombre, apellido, correo, contraseña y rol son obligatorios"
      });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const rolesPermitidos = ["productor", "comprador"];

    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({ message: "Rol no válido" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 8 caracteres"
      });
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValido.test(emailNormalizado)) {
      return res.status(400).json({ message: "Correo electrónico no válido" });
    }

    const existeUsuario = await Usuario.findOne({ email: emailNormalizado });
    if (existeUsuario) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Token de verificación (expira en 24h)
    const tokenVerificacion = crypto.randomBytes(32).toString("hex");
    const tokenExpiracion = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUsuario = new Usuario({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: emailNormalizado,
      password: hashedPassword,
      celular,
      rol,
      estado: "pendiente",
      codigoRecuperacion: tokenVerificacion,
      codigoExpiracion: tokenExpiracion,
    });

    await newUsuario.save();

    // Enviar correo de verificación
    await enviarCorreoVerificacion(nombre.trim(), emailNormalizado, tokenVerificacion);

    res.status(201).json({
      message: "Cuenta creada. Revisa tu correo para activarla.",
    });

  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

export const verificarEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const usuario = await Usuario.findOne({
      codigoRecuperacion: token,
      codigoExpiracion: { $gt: new Date() },
    });

    if (!usuario) {
      // Token inválido o expirado → página de error en el frontend
      return res.redirect(`${process.env.FRONTEND_URL}/verificar-email?status=invalido`);
    }

    // Activar cuenta y limpiar token
    usuario.estado = "activo";
    usuario.codigoRecuperacion = null;
    usuario.codigoExpiracion = null;
    await usuario.save();

    // Enviar correo de bienvenida
    await enviarCorreoBienvenida(usuario.nombre, usuario.email);

    // Redirigir al frontend con éxito
    return res.redirect(`${process.env.FRONTEND_URL}/verificar-email?status=ok`);

  } catch (error) {
    console.error("Error al verificar email:", error);
    return res.redirect(`${process.env.FRONTEND_URL}/verificar-email?status=error`);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Correo y contraseña son obligatorios" });
    }

    const emailNormalizado = email.trim().toLowerCase();

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValido.test(emailNormalizado)) {
      return res.status(400).json({ message: "Correo electrónico no válido" });
    }

    const user = await Usuario.findOne({ email: emailNormalizado });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "Esta cuenta usa Google. Inicia sesión con Google."
      });
    }

    if (user.estado === "pendiente") {
      return res.status(403).json({
        message: "Debes verificar tu correo electrónico antes de iniciar sesión."
      });
    }

    if (user.estado === "rechazado") {
      return res.status(403).json({
        message: "Tu cuenta ha sido rechazada. Contacta al administrador."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    await Usuario.findByIdAndUpdate(user._id, { ultimaConexion: new Date() });

    const token = jwt.sign(
      { id: user._id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(200).json({
      token,
      role: user.rol,
      name: user.nombre,
      apellido: user.apellido,
      id: user._id,
      celular: user.celular,
      email: user.email,
    });

  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

export const googleCallback = (req, res) => {
  try {
    const token = jwt.sign(
      {
        id: req.user._id,
        rol: req.user.rol,
        name: req.user.nombre,
        apellido: req.user.apellido,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    if (req.user.estado === "pendiente") {
      return res.redirect(
        `${process.env.FRONTEND_URL}/completar-perfil?token=${token}`
      );
    }

    res.redirect(`${process.env.FRONTEND_URL}/auth/google?token=${token}`);

  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
  }
};