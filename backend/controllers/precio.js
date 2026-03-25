import PrecioModel from "../models/precio.js";

export const getprecios = async (req, res) => {
    try {
        const { tipoCafe } = req.query;
        const filtro = tipoCafe ? { tipoCafe } : {};

        const precios = await PrecioModel.find(filtro)
            .populate("comprador", "nombreempresa direccion")
            .sort({ preciocarga: -1 });

        res.json(precios);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener precios", error: error.message });
    }
};

export const getpreciosBycomprador = async (req, res) => {
    try {
        const precios = await PrecioModel.find({ comprador: req.params.compradorId })
            .populate("comprador", "nombreempresa")
            .sort({ createdAt: -1 });

        res.json(precios);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener precios del comprador", error: error.message });
    }
};

export const createprecio = async (req, res) => {
    try {
        const { comprador, preciocarga, tipocafe } = req.body;

        // ✅ Convertir explícitamente a número
        const nuevoPrecio = new PrecioModel({
            comprador,
            preciocarga: Number(preciocarga),  // <-- fix
            tipocafe
        });

        await nuevoPrecio.save();
        res.status(201).json(nuevoPrecio);
    } catch (error) {
        console.log("Error completo:", error);
        res.status(400).json({ message: "Error al crear precio", error: error.message });
    }
};

export const updateprecio = async (req, res) => {
    try {
        const { preciocarga, tipocafe } = req.body;

        const precio = await PrecioModel.findById(req.params.id);
        if (!precio) return res.status(404).json({ message: "Precio no encontrado" });

        precio.preciocarga = preciocarga ? Number(preciocarga) : precio.preciocarga;  // <-- fix
        precio.tipocafe = tipocafe ?? precio.tipocafe;
        await precio.save(); // el pre("save") recalcula preciokg automáticamente ✅

        res.json(precio);
    } catch (error) {
        res.status(400).json({ message: "Error al actualizar precio", error: error.message });
    }
};

export const deleteprecio = async (req, res) => {
    try {
        const precio = await PrecioModel.findByIdAndDelete(req.params.id);
        if (!precio) return res.status(404).json({ message: "Precio no encontrado" });
        res.json({ message: "Precio eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar precio", error: error.message });
    }
};
