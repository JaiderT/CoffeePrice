import CompradorModel from "../models/comprador.js";

export const getcompradores = async (req, res) => {
    try {
        const compradores = await CompradorModel.find().populate("usuario", "nombre apellido email");
        res.json(compradores);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener compradores", error: error.message });
    }
};

export const createcomprador = async (req, res) => {
    try {
        if (req.user?.rol !== "comprador") {
            return res.status(403).json({
                message: "Solo los usuarios con rol comprador pueden crear este perfil"
            });
            }

        const { nombreempresa, direccion, telefono, horario, horarioApertura, horarioCierre, latitud, longitud } = req.body;

        if (!nombreempresa || !direccion || !telefono) {
            return res.status(400).json({
                message: "Nombre de empresa, dirección y teléfono son obligatorios"
            });
        }

        const usuario = req.user.id;
        const yaexiste = await CompradorModel.findOne({ usuario });

        if (yaexiste) {
            return res.status(400).json({
                message: "Este usuario ya tiene un perfil de comprador"
            });
        }

        const nuevoComprador = new CompradorModel({
            usuario,
            nombreempresa: nombreempresa.trim(),
            direccion: direccion.trim(),
            telefono: telefono.trim(),
            horario: horario?.trim() || null,
            horarioApertura: horarioApertura || "08:00",
            horarioCierre: horarioCierre || "17:00",
            latitud: latitud ? parseFloat(latitud) : null,
            longitud: longitud ? parseFloat(longitud) : null,
        });

        await nuevoComprador.save();

        res.status(201).json({
            comprador: nuevoComprador,
            message: "Perfil creado. Tu cuenta está pendiente de aprobación."
        });
    } catch (error) {
        res.status(400).json({ message: "Error al crear comprador", error: error.message });
    }
};

export const updatecomprador = async (req, res) => {
    try {
        const { nombreempresa, direccion, telefono, horario, horarioApertura, horarioCierre } = req.body;

        const compradorExistente = await CompradorModel.findById(req.params.id);

        if (!compradorExistente) {
            return res.status(404).json({ message: "Comprador no encontrado" });
        }

        const esAdmin = req.user?.rol === "admin";
        const esPropietario = compradorExistente.usuario.toString() === req.user.id;

        if (!esAdmin && !esPropietario) {
            return res.status(403).json({
                message: "No tienes permisos para actualizar este comprador"
            });
        }

        if (nombreempresa !== undefined) compradorExistente.nombreempresa = nombreempresa.trim();
        if (direccion !== undefined) compradorExistente.direccion = direccion.trim();
        if (telefono !== undefined) compradorExistente.telefono = telefono.trim();
        if (horario !== undefined) compradorExistente.horario = horario.trim();
        if (horarioApertura !== undefined) compradorExistente.horarioApertura = horarioApertura;
        if (horarioCierre !== undefined) compradorExistente.horarioCierre = horarioCierre;

        await compradorExistente.save();
        res.json(compradorExistente);
    } catch (error) {
        res.status(400).json({ message: "Error al actualizar comprador", error: error.message });
    }
};

export const deletecomprador = async (req, res) => {
    try {
        const comprador = await CompradorModel.findByIdAndDelete(req.params.id);
        if (!comprador) return res.status(404).json({ message: "Comprador no encontrado" });
        res.json({ message: "Comprador eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar comprador", error: error.message });
    }
};

export const getcompradorByUsuario = async (req, res) => {
    try {
        const esAdmin = req.user?.rol === "admin";
        const esPropietario = req.params.usuarioId === req.user.id;

        if (!esAdmin && !esPropietario) {
            return res.status(403).json({
                message: "No tienes permisos para ver este comprador"
            });
        }

        const comprador = await CompradorModel.findOne({ usuario: req.params.usuarioId })
            .populate("usuario", "nombre apellido email");

        if (!comprador) {
            return res.status(404).json({ message: "Comprador no encontrado" });
        }

        res.json(comprador);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener comprador", error: error.message });
    }
};
