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

        const { nombreempresa, direccion, telefono, horario, horarioApertura, horarioCierre, latitud, longitud, tipoempresa, municipio, descripcion, servicios } = req.body;

        if (!nombreempresa || !direccion || !telefono) {
            return res.status(400).json({
                message: "Nombre de empresa, dirección y teléfono son obligatorios"
            });
        }

        // Validar que el nombre solo tenga letras, espacios, puntos y &
        const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.&]+$/;
        if (!soloLetras.test(nombreempresa.trim())) {
            return res.status(400).json({ message: "El nombre de la empresa solo puede contener letras" });
        }

        // Verificar si ya existe una empresa con ese nombre
        const empresaExistente = await CompradorModel.findOne({
            nombreempresa: { $regex: new RegExp(`^${nombreempresa.trim()}$`, 'i') }
        });
        if (empresaExistente) {
            return res.status(400).json({ message: "Ya existe una empresa registrada con ese nombre" });
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
            tipoempresa: tipoempresa || "independiente",
            direccion: direccion.trim(),
            municipio: municipio || "El Pital",
            telefono: telefono?.trim() || null,
            descripcion: descripcion?.trim() || null,
            servicios: servicios || [],
            horario: horario?.trim() || null,
            horarioApertura: horarioApertura || "07:00",
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
        const { nombreempresa, direccion, telefono, horario, horarioApertura, horarioCierre, latitud, longitud, tipoempresa, municipio, descripcion, servicios } = req.body;

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

        if (nombreempresa !== undefined) {
            const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.&]+$/;
            if (!soloLetras.test(nombreempresa.trim())) {
                return res.status(400).json({ message: "El nombre de la empresa solo puede contener letras" });
            }
            const empresaExistente = await CompradorModel.findOne({
                nombreempresa: { $regex: new RegExp(`^${nombreempresa.trim()}$`, 'i') },
                _id: { $ne: compradorExistente._id }
            });
            if (empresaExistente) {
                return res.status(400).json({ message: "Ya existe una empresa registrada con ese nombre" });
            }
            compradorExistente.nombreempresa = nombreempresa.trim();
        }

        if (tipoempresa !== undefined) compradorExistente.tipoempresa = tipoempresa;
        if (municipio !== undefined) compradorExistente.municipio = municipio;
        if (descripcion !== undefined) compradorExistente.descripcion = descripcion?.trim() || null;
        if (servicios !== undefined) compradorExistente.servicios = servicios;
        if (direccion !== undefined) compradorExistente.direccion = direccion.trim();
        if (telefono !== undefined) compradorExistente.telefono = telefono.trim();
        if (horario !== undefined) compradorExistente.horario = horario.trim();
        if (horarioApertura !== undefined) compradorExistente.horarioApertura = horarioApertura;
        if (horarioCierre !== undefined) compradorExistente.horarioCierre = horarioCierre;
        if (latitud !== undefined) compradorExistente.latitud = latitud ? parseFloat(latitud) : null;
        if (longitud !== undefined) compradorExistente.longitud = longitud ? parseFloat(longitud) : null;

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
