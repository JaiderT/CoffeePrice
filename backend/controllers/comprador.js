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
        const { usuario, nombreempresa, direccion, telefono, horario } = req.body;

        const yaexiste = await CompradorModel.findOne({ usuario });
        if (yaexiste) return res.status(400).json({ message: "Este usuario ya tiene un perfil de comprador" });

        const nuevoComprador = new CompradorModel({
            usuario,
            nombreempresa,
            direccion,
            telefono,
            horario,
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

        const comprador = await CompradorModel.findByIdAndUpdate(
            req.params.id,
            { nombreempresa, direccion, telefono, horario },
            { new: true, runValidators: true }
        );

        if (!comprador) return res.status(404).json({ message: "Comprador no encontrado" });
        res.json(comprador);
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