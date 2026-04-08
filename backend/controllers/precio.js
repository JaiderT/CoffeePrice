import PrecioModel from "../models/precio.js";
import CompradorModel from "../models/comprador.js";

export const getprecios = async (req, res) => {
    try {
        const { tipocafe } = req.query;
        const filtro = tipocafe ? { tipocafe } : {};

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

        if (!comprador || preciocarga === undefined || !tipocafe) {
            return res.status(400).json({
                message: "Comprador, precio por carga y tipo de café son obligatorios"
            });
        }

        const precioNumerico = Number(preciocarga);
        const tiposPermitidos = ["pergamino_seco", "especial", "organico", "verde"];

        if (Number.isNaN(precioNumerico) || precioNumerico <= 0) {
            return res.status(400).json({
                message: "El precio por carga debe ser un número mayor a 0"
            });
        }

        if (!tiposPermitidos.includes(tipocafe)) {
            return res.status(400).json({
                message: "Tipo de café no válido"
            });
        }

        const compradorExistente = await CompradorModel.findById(comprador);

        if (!compradorExistente) {
            return res.status(404).json({ message: "Comprador no encontrado" });
        }

        const esAdmin = req.user?.rol === "admin";
        const esPropietario = compradorExistente.usuario.toString() === req.user.id;

        if (!esAdmin && !esPropietario) {
            return res.status(403).json({
                message: "No tienes permisos para crear precios para este comprador"
            });
        }

        const nuevoPrecio = new PrecioModel({
            comprador,
            preciocarga: precioNumerico,
            tipocafe
        });

        await nuevoPrecio.save();
        res.status(201).json(nuevoPrecio);
    } catch (error) {
        res.status(400).json({ message: "Error al crear precio", error: error.message });
    }
};

export const updateprecio = async (req, res) => {
    try {
        const { preciocarga, tipocafe } = req.body;

        const precio = await PrecioModel.findById(req.params.id);
        if (!precio) {
            return res.status(404).json({ message: "Precio no encontrado" });
        }

        const compradorExistente = await CompradorModel.findById(precio.comprador);
        if (!compradorExistente) {
            return res.status(404).json({ message: "Comprador asociado no encontrado" });
        }

        const esAdmin = req.user?.rol === "admin";
        const esPropietario = compradorExistente.usuario.toString() === req.user.id;

        if (!esAdmin && !esPropietario) {
            return res.status(403).json({
                message: "No tienes permisos para actualizar este precio"
            });
        }

        if (preciocarga !== undefined) {
            const precioNumerico = Number(preciocarga);

            if (Number.isNaN(precioNumerico) || precioNumerico <= 0) {
                return res.status(400).json({
                    message: "El precio por carga debe ser un número mayor a 0"
                });
            }

            precio.preciocarga = precioNumerico;
        }

        if (tipocafe !== undefined) {
            const tiposPermitidos = ["pergamino_seco", "especial", "organico", "verde"];

            if (!tiposPermitidos.includes(tipocafe)) {
                return res.status(400).json({
                    message: "Tipo de café no válido"
                });
            }

            precio.tipocafe = tipocafe;
        }

        await precio.save();

        res.json(precio);
    } catch (error) {
        res.status(400).json({ message: "Error al actualizar precio", error: error.message });
    }
};

export const deleteprecio = async (req, res) => {
    try {
        const precio = await PrecioModel.findById(req.params.id);

        if (!precio) {
            return res.status(404).json({ message: "Precio no encontrado" });
        }

        const compradorExistente = await CompradorModel.findById(precio.comprador);

        if (!compradorExistente) {
            return res.status(404).json({ message: "Comprador asociado no encontrado" });
        }

        const esAdmin = req.user?.rol === "admin";
        const esPropietario = compradorExistente.usuario.toString() === req.user.id;

        if (!esAdmin && !esPropietario) {
            return res.status(403).json({
                message: "No tienes permisos para eliminar este precio"
            });
        }

        await precio.deleteOne();

        res.json({ message: "Precio eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar precio", error: error.message });
    }
};
