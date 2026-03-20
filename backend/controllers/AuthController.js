import Usuario from "../models/usuario.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//Registro 
export const register = async (req, res) => {
  try {
    const { nombre, apellido, email, password, celular, rol } = req.body;

    //Verificar si el usuario ya existe 
    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    //Encriptar la contraseña 
    const hashedPassword = await bcrypt.hash(password, 10);

    //Crear el usuario
    const newUsuario = new Usuario({ nombre, apellido, email, password: hashedPassword, celular, rol });
    await newUsuario.save();

    res.status(201).json({ message: "Usuario registrado exitosamente" });

  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar el usuario
    const user = await Usuario.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Generar el token JWT
    const token = jwt.sign(
      { id: user._id, role: user.rol },
      "coffeprice_secret",
      { expiresIn: "1d" }
    );

    res.status(200).json({ token, role: user.rol, name: user.nombre, apellido: user.apellido });

  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};
