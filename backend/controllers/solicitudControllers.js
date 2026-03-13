import Solicitud from "../models/solicitud.js";

export const getSolicitudesByCaficultor = async (req, res) => {
    try {
        const solicitudes = await Solicitud.find({ caficultor: req.params.caficultorId })
            .populate("comprador", "nombreempresa tipo direccion")
            .sort({ createdAt: -1 });

        res.json(solicitudes);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener solicitudes", error: error.message }); // ✅ era ,json
    }
};

export const getSolicitudesByComprador = async (req, res) => {
    try {
        const solicitudes = await Solicitud.find({ comprador: req.params.compradorId })
            .populate("caficultor", "nombre apellido celular")
            .sort({ createdAt: -1 }); // ✅ era createAt

        res.json(solicitudes);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener solicitudes del comprador", error: error.message });
    }
};

export const getSolicitudById = async (req, res) => { // ✅ era getSolicitudesById
    try {
        const solicitud = await Solicitud.findById(req.params.id)
            .populate("caficultor", "nombre apellido celular")
            .populate("comprador", "nombreempresa tipo direccion");

        if (!solicitud) return res.status(404).json({ message: "Solicitud no encontrada" });
        res.json(solicitud);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener solicitud", error: error.message }); // ✅ era .jso
    }
};

export const createSolicitud = async (req, res) => {
    try {
        const { caficultor, comprador, cantidadcargas, tipocafe, mensaje } = req.body;

        const solicitud = new Solicitud({ caficultor, comprador, cantidadcargas, tipocafe, mensaje });
        await solicitud.save();

        res.status(201).json(solicitud);
    } catch (error) {
        res.status(400).json({ message: "Error al crear solicitud", error: error.message });
    }
};

export const responderSolicitud = async (req, res) => {
    try {
        const { estado } = req.body;

        if (!["aceptada", "rechazada"].includes(estado)) {
            return res.status(400).json({ message: "Estado invalido. Usa 'aceptada' o 'rechazada'" });
        }

        const solicitud = await Solicitud.findByIdAndUpdate(
            req.params.id,
            { estado },
            { new: true }
        );

        if (!solicitud) return res.status(404).json({ message: "Solicitud no encontrada" });
        res.json({ message: `Solicitud ${estado}`, solicitud });
    } catch (error) {
        res.status(400).json({ message: "Error al responder solicitud", error: error.message });
    }
};

export const deleteSolicitud = async (req, res) => {
    try {
        const solicitud = await Solicitud.findByIdAndDelete(req.params.id);
        if (!solicitud) return res.status(404).json({ message: "Solicitud no encontrada" });
        res.json({ message: "Solicitud eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar solicitud", error: error.message });
    }
};