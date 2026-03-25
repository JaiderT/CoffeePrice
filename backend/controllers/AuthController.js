import Usuario from "../models/usuario.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { nombre, apellido, email, password, celular, rol } = req.body;

    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const estado = rol === 'comprador' ? 'pendiente' : 'activo' // ← agregar

    const newUsuario = new Usuario({ 
      nombre, apellido, email, 
      password: hashedPassword, 
      celular, rol, estado // ← agregar estado
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

    const user = await Usuario.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // ← usuario registrado con Google no tiene password
    if (!user.password) {
      return res.status(400).json({ 
        message: "Esta cuenta usa Google. Inicia sesión con Google." 
      });
    }

    // ← comprador pendiente no puede entrar
    if (user.estado === 'pendiente') {
      return res.status(403).json({ 
        message: "Tu cuenta está pendiente de aprobación" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.rol },
      process.env.JWT_SECRET, // ← sacar del hardcode
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.status(200).json({ token, role: user.rol, name: user.nombre, apellido: user.apellido, id: user._id });

  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// ← función nueva para el callback de Google
export const googleCallback = (req, res) => {
  try {
    const token = jwt.sign(
      { id: req.user._id, role: req.user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    )

    // comprador nuevo va a completar perfil empresarial
    if (req.user.estado === 'pendiente') {
      return res.redirect(
        `${process.env.FRONTEND_URL}/completar-perfil?token=${token}`
      )
    }

    res.redirect(`${process.env.FRONTEND_URL}/auth/google?token=${token}`)

  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`)
  }
}
