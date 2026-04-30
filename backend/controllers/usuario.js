import Usuario from "../models/usuario.js";
import bcrypt from "bcryptjs";

export const getusuario = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select("-password");
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener usuarios", error: error.message });
    }
};

export const updateusuario = async (req, res) => {
    try {
        const { nombre, apellido, celular, estado, rol } = req.body;

        const datosActualizados = {};

        if (nombre !== undefined) datosActualizados.nombre = nombre;
        if (apellido !== undefined) datosActualizados.apellido = apellido;
        if (celular !== undefined) datosActualizados.celular = celular;

        if (req.user?.rol === "admin") {
            if (estado !== undefined) datosActualizados.estado = estado;
            if (rol !== undefined) datosActualizados.rol = rol;
        }

        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            datosActualizados,
            { new: true, runValidators: true }
        ).select("-password");

        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json(usuario);
    } catch (error) {
        res.status(400).json({ message: "Error al actualizar", error: error.message });
    }
};

export const cambiarpassword = async (req, res) => {
    try {
        const { passwordactual, passwordnueva } = req.body;

        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

        const esValida = await bcrypt.compare(passwordactual, usuario.password);
        if (!esValida) return res.status(400).json({ message: "Contraseña actual incorrecta" });

        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(passwordnueva, salt);
        await usuario.save();

        res.json({ message: "Contraseña actualizada" });
    } catch (error) {
        res.status(500).json({ message: "Error al cambiar la contraseña", error: error.message });
    }
};

export const eliminarusuario = async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            { estado: 'eliminado' },
            { new: true }
        );
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
        res.json({ message: "Usuario eliminado" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar usuario", error: error.message });
    }
};

export const eliminarMiCuenta = async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(
            req.user.id,
            { estado: 'eliminado' },
            { new: true }
        );
        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.clearCookie('auth_token');
        res.json({ message: "Tu cuenta fue eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar tu cuenta", error: error.message });
    }
};

export const suspenderMiCuenta = async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(
            req.user.id,
            { estado: 'suspendido' },
            { new: true }
        );
        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.clearCookie('auth_token');
        res.json({ message: "Tu cuenta fue suspendida. Puedes reactivarla iniciando sesión y contactando al administrador." });
    } catch (error) {
        res.status(500).json({ message: "Error al suspender tu cuenta", error: error.message });
    }
};

export const cambiarestado = async (req, res) => {
    try {
        const { estado } = req.body;
        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            { estado },
            { new: true, runValidators: true }
        ).select("-password");
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
        res.json(usuario);
    } catch (error) {
        res.status(400).json({ message: "Error al cambiar estado", error: error.message });
    }
};
