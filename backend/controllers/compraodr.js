import comprador from "../models/Comprador.js";

export const getcompradores = async (req, res) => {
    try {
        const compradores = await comprador.find().populate("usuario", "nombre apellido email");
        res.json(compradores);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener compradores", error: error.message });
    }
};

export const createcomprador = async (req, res) => {
    try {
        const { usuario, nombreempresa, direccion, telefono, horario, } = req.body;

        const yaexiste = await comprador.findOne({ usuario });
            if (yaexiste) return res.status(400).json({ mensaje: "Este usuario ya tiene un perfil de comprador" });

        const comprador = new comprador({
        usuario,
        nombreempresa,
        direccion,
        telefono,
        horario,
        });

        await comprador.save();
        res.status(201).json(comprador);
    } catch (error) {
        res.status(400).json({ mensaje: "Error al crear comprador", error: error.message });
    }
};

export const updatecomprador = async (req, res) => {
    try {
        const { nombreempresa, direccion, telefono, horario,} = req.body;

        const comprador = await comprador.findByIdAndUpdate(
        req.params.id,
        { nombreempresa, direccion, telefono, horario},
        { new: true, runValidators: true }
    );

        if (!comprador) return res.status(404).json({ mensaje: "Comprador no encontrado" });
            res.json(comprador);
    } catch (error) {
        res.status(400).json({ mensaje: "Error al actualizar comprador", error: error.message });
    }
};

export const deletecomprador = async (req, res) => {
    try {
        const comprador = await comprador.findByIdAndDelete(req.params.id);
        if (!comprador) return res.status(404).json({ mensaje: "Comprador no encontrado" });
        res.json({ mensaje: "Comprador eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar comprador", error: error.message });
    }
};