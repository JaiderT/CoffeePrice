import Usuario from "../models/usuario.js";
import bcrypt from "bcryptjs";
import CompradorModel from "../models/comprador.js";
import { ESTADOS_REVISION_COMPRADOR } from "../utils/compradorEstado.js";
import { enviarDecisionComprador } from "../services/emailService.js";
import { limpiarCookieAuth } from "../utils/cookieOptions.js";

export const getusuario = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select("-password -codigoRecuperacion -codigoExpiracion -codigoVerificacion -codigoVerificacionExpira");
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
        ).select("-password -codigoRecuperacion -codigoExpiracion -codigoVerificacion -codigoVerificacionExpira");
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
        res.json(usuario);
    } catch (error) {
        res.status(400).json({ message: "Error al actualizar", error: error.message });
    }
};

export const cambiarpassword = async (req, res) => {
    try {
        const { passwordnueva } = req.body;
        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(passwordnueva, salt);
        await usuario.save();
        res.json({ message: "Contrasena actualizada" });
    } catch (error) {
        res.status(500).json({ message: "Error al cambiar la contrasena", error: error.message });
    }
};

export const eliminarusuario = async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            { estado: "eliminado" },
            { new: true }
        ).select("-password -codigoRecuperacion -codigoExpiracion -codigoVerificacion -codigoVerificacionExpira");
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
        res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar usuario", error: error.message });
    }
};

export const eliminarMiCuenta = async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(
            req.user.id,
            { estado: "eliminado" },
            { new: true }
        );
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
        limpiarCookieAuth(res, "auth_token");
        limpiarCookieAuth(res, "connect.sid");
        res.json({ message: "Tu cuenta fue eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar tu cuenta", error: error.message });
    }
};

export const suspenderMiCuenta = async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(
            req.user.id,
            { estado: "suspendido" },
            { new: true }
        );
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
        res.json({ message: "Tu cuenta fue suspendida. Puedes reactivarla cuando quieras." });
    } catch (error) {
        res.status(500).json({ message: "Error al suspender tu cuenta", error: error.message });
    }
};

export const cambiarestado = async (req, res) => {
    try {
        const { estado, motivoRevision } = req.body;
        const usuario = await Usuario.findById(req.params.id).select("-password -codigoRecuperacion -codigoExpiracion -codigoVerificacion -codigoVerificacionExpira");
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

        usuario.estado = estado;
        await usuario.save();

        if (usuario.rol === "comprador") {
            const comprador = await CompradorModel.findOne({ usuario: usuario._id });
            if (comprador) {
                if (estado === "activo") {
                    comprador.estadoRevision = ESTADOS_REVISION_COMPRADOR.APROBADO;
                    comprador.motivoRevision = null;
                } else if (estado === "rechazado") {
                    comprador.estadoRevision = ESTADOS_REVISION_COMPRADOR.RECHAZADO;
                    comprador.motivoRevision = motivoRevision?.trim() || "La solicitud no cumple los criterios de validacion actuales.";
                } else if (estado === "pendiente") {
                    comprador.estadoRevision = ESTADOS_REVISION_COMPRADOR.EN_REVISION;
                    comprador.motivoRevision = null;
                }
                comprador.fechaRevision = new Date();
                comprador.aprobadoPor = req.user.id;
                await comprador.save();
            }

            await enviarDecisionComprador({
                destinatario: usuario.email,
                nombreUsuario: `${usuario.nombre} ${usuario.apellido}`.trim(),
                estado,
                motivoRevision,
            });
        }

        res.json(usuario);
    } catch (error) {
        res.status(400).json({ message: "Error al cambiar estado", error: error.message });
    }
};
