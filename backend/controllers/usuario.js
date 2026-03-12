import usuario from '../models/usuario.js';
import bcrypt from "bcryptjs";

export const getusuario = async (req, res) => {
    try {
        const usuario = await usuario.find().select("-password");
        res.json(usuario);
    } catch (error) {
        res.status(500).json({message: "Error al obtener usuarios", error: error.message});
    }
};