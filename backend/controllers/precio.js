import precio from "../models/precio.js";

export const getprecios = async (req, res) => {
    try {
        const { tipoCafe } = req.query;
        const filtro = tipoCafe ? { tipoCafe } : {};

        const precios = await precio.find(filtro)
            .populate("comprador", "nombreEmpresa direccion")
            .sort({ createdAt: -1 });
        
            res.json(precios);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener precios", error: error.message});
    }
};

export const getpreciosBycomprador = async (req, res) => {
    try {
        const precios = await precio.find({ comprador: req.params.compradorId })
            .populate("comprador", "nombreEmpresa ")
            .sort({ createdAt: -1 });

            res.json(precios);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener precios del comprador", error: error.message });
    }
};

export const createprecio = async (req, res) => {
    try {
        const { comprador, preciocarga, tipocafe } = req.body;

        const precio = new precio({ comprador, preciocarga, tipocafe });
        await precio.save(); // precioKg se calcula automáticamente en el pre-save

        res.status(201).json(precio);
    } catch (error) {
        res.status(400).json({ mensaje: "Error al crear precio", error: error.message });
    }
};

export const updateprecio = async (req, res) => {
    try {
        const { preciocarga, tipocafe } = req.body;

        // Se busca y actualiza manualmente para que el pre-save hook recalcule precioKg
        const precio = await precio.findById(req.params.id);
            if (!precio) return res.status(404).json({ mensaje: "Precio no encontrado" });

        precio.preciocarga = preciocarga ?? precio.preciocarga;
        precio.tipocafe = tipocafe ?? precio.tipocafe;
        await precio.save();

        res.json(precio);
    } catch (error) {
        res.status(400).json({ mensaje: "Error al actualizar precio", error: error.message });
    }
};

export const deleteprecio = async (req, res) => {
    try {
        const precio = await precio.findByIdAndDelete(req.params.id);
            if (!precio) return res.status(404).json({ mensaje: "Precio no encontrado" });
        res.json({ mensaje: "Precio eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar precio", error: error.message });
    }
};
