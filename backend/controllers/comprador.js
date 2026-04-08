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
        const { nombreempresa, direccion, telefono, horario } = req.body;

        if (!nombreempresa || !direccion || !telefono || !horario) {
            return res.status(400).json({
                message: "Nombre de empresa, dirección, teléfono y horario son obligatorios"
            });
        }

        const nombreempresaLimpio = nombreempresa.trim();
        const direccionLimpia = direccion.trim();
        const telefonoLimpio = telefono.trim();
        const horarioLimpio = horario.trim();

        if (!nombreempresaLimpio || !direccionLimpia || !telefonoLimpio || !horarioLimpio) {
            return res.status(400).json({
                message: "Todos los campos del perfil comprador deben estar completos"
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
            nombreempresa: nombreempresaLimpio,
            direccion: direccionLimpia,
            telefono: telefonoLimpio,
            horario: horarioLimpio,
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
        const { nombreempresa, direccion, telefono, horario } = req.body;

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
            const nombreempresaLimpio = nombreempresa.trim();
            if (!nombreempresaLimpio) {
                return res.status(400).json({
                    message: "El nombre de la empresa no puede estar vacío"
                });
            }
            compradorExistente.nombreempresa = nombreempresaLimpio;
        }

        if (direccion !== undefined) {
            const direccionLimpia = direccion.trim();
            if (!direccionLimpia) {
                return res.status(400).json({
                    message: "La dirección no puede estar vacía"
                });
            }
            compradorExistente.direccion = direccionLimpia;
        }

        if (telefono !== undefined) {
            const telefonoLimpio = telefono.trim();
            if (!telefonoLimpio) {
                return res.status(400).json({
                    message: "El teléfono no puede estar vacío"
                });
            }
            compradorExistente.telefono = telefonoLimpio;
        }

        if (horario !== undefined) {
            const horarioLimpio = horario.trim();
            if (!horarioLimpio) {
                return res.status(400).json({
                    message: "El horario no puede estar vacío"
                });
            }
            compradorExistente.horario = horarioLimpio;
        }

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

