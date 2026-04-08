import Usuario from "../models/usuario.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
          return res.status(400).json({
            message: "Rol no válido"
          });
        }

        if (password.length < 8) {
          return res.status(400).json({
            message: "La contraseña debe tener al menos 8 caracteres"
          });
        }

        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailValido.test(emailNormalizado)) {
          return res.status(400).json({
            message: "Correo electrónico no válido"
          });
        }

    const existeUsuario = await Usuario.findOne({ email: emailNormalizado });
    if (existeUsuario) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const estado = rol === 'comprador' ? 'pendiente' : 'activo';

    const newUsuario = new Usuario({ 
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: emailNormalizado,
      password: hashedPassword,
      celular,
      rol,
      estado
    });

    await newUsuario.save();

    res.status(201).json({ message: "Usuario registrado exitosamente" });

  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
      if (!email || !password) {
    return res.status(400).json({
      message: "Correo y contraseña son obligatorios"
    });
  }

  const emailNormalizado = email.trim().toLowerCase();

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailValido.test(emailNormalizado)) {
    return res.status(400).json({
      message: "Correo electrónico no válido"
    });
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

    if (user.estado === 'pendiente') {
      return res.status(403).json({
        message: "Tu cuenta está pendiente de aprobación"
      });
    }

    if (user.estado === 'rechazado') {
      return res.status(403).json({
        message: "Tu cuenta ha sido rechazada. Contacta al administrador."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Guardar última conexión
    await Usuario.findByIdAndUpdate(user._id, { ultimaConexion: new Date() });

    const token = jwt.sign(
      { id: user._id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
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

    if (req.user.estado === 'pendiente') {
      return res.redirect(
        `${process.env.FRONTEND_URL}/completar-perfil?token=${token}`
      );
    }

    res.redirect(`${process.env.FRONTEND_URL}/auth/google?token=${token}`);

  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
  }
};
