import Usuario from "../models/usuario.js";
import bcrypt from "bcryptjs";

export const getusuario = async (req, res) => {
    try {
        const usuario = await Usuario.find().select("-password");
        res.json(usuario);
    } catch (error) {
        res.status(500).json({message: "Error al obtener usuarios", error: error.message});
    }
};

export const updateusuario = async (req, res) => {
    try {
        const { nombre, apellido, celular, } = req.body;

        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            { nombre, apellido, celular },
            { new: true, runValidators: true}
        ).select("password");

        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado"});
        res.json(usuario);
    } catch (error) {
        res.status(400).json({message: "error al actualizar", error: error.message});
    }
};

export const cambiarpassword = async (req, res) => {
    try {
        const { passwordactual, passwordnueva } = req.body;

        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) return res.status(404).json({message: "usuario no encontrado"});

        const esValida = await bcrypt.compare(passwordactual, usuario.password);
        if (!esValida) return res.status(400).json({ message: "Contraseña actual incorrecta"});

        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(passwordnueva, salt);
        await Usuario.save();

        res.json({ message:"Contraseña Actualizada"})
    } catch (error) {
        res.status(500).json({ message: "Error al cambiar la contraseña"})
    }
};

export const eliminarusuario = async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndDelete(req.params.id);
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado "});
        res.json({ message: "Usuario Eliminado "})
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar usuario", error: error.message });
    }
};