import Solicitud from "../models/solicitud.js";

// @desc    Obtener solicitudes de un caficultor
// @route   GET /api/solicitudes/caficultor/:caficultorId

export const getSolicitudesByCaficultor = async (req, res) => {
    try {
        const solicitudes = await Solicitud.find({ caficultor: req.params.caficultorId })
        .populate("comprador", "nombreempresa tipo direccion")
        .sort({ createdAt: -1 });

        res.json(solicitudes);
    } catch (error) {
        res.status(500),json({message: "Error al obtener solicitudes", error: error.message});
    }
};

// @desc    Obtener solicitudes recibidas por un comprador
// @route   GET /api/solicitudes/comprador/:compradorId

export const getSolicitudesByComprador = async (req, res) => {
    try {
        const solicitudes = await Solicitud.find({ comprador: req.params.compradorId })
        .populate("caficultor", "nombre apellido celular")
        .sort({ createAt: -1 });

        res.json(solicitudes);
    } catch (error) {
        res.status(500).json({message: "Error al obtener solicitudes del comprador", error: error.message});
    }
};

// @desc    Obtener una solicitud por ID
// @route   GET /api/solicitudes/:id

export const getSolicitudesById = async (req, res) => {
    try {
        const solicitud = await Solicitud.findById(req.params.id)
        .populate("caficultor", "nombre apellido celular")
        .populate("comprador", "nombreempresa tipo direccion");

        if (!solicitud) return res.status(404).json({message: "Solicitud no encontrada"});
        res.json(solicitud);
    } catch (error) {
        res.status(500).jso({message: "Error al obtener solicitud", error: error.message});
    }
};

// @desc    Crear una solicitud
// @route   POST /api/solicitudes

export const createSolicitud = async (req, res) => {
    try {
        const { caficultor, comprador, cantidadcargas, tipocafe, mensaje } = req.body;

        const solicitud = new Solicitud ({ caficultor, comprador, cantidadcargas, tipocafe, mensaje });
        await solicitud.save();

        res.status(201).json(solicitud);
    } catch (error) {
        res.status(400).json({message: "Error al crear solicitud", error: error.message});
    }
};

// @desc    Responder solicitud (aceptar o rechazar)
// @route   PUT /api/solicitudes/:id/responder

export const responderSolicitud = async (req, res) => {
    try {
        const { estado } = req.body;

        if (!["aceptada", "rechazada"].includes(estado)) {
            return res.status(400).json({message: "Estado invalido. Usa 'aceptada' 0 'rechazada'"});
        }

        const solicitud = await Solicitud.findByIdAndUpdate(
            req.params.id,
            {estado},
            {new: true}
        );

        if (!solicitud) return res.status(404).json({message: "Solicitud no encontrada"});
        res.json({message: `Solicitud ${estado}`, solicitud });
    } catch (error) {
        res.status(400).json({message: "Error al responder solicitud", error: error.message});
    }
};

// @desc    Eliminar solicitud
// @route   DELETE /api/solicitudes/:id

export const deleteSolicitud = async (req, res) => {
    try {
        const solicitud = await Solicitud.findByIdAndDelete(req.params.id);
        if (!solicitud) return res.status(404).json({message: "Solicitud no encontrada"});
        res.json({message: "Solicitud eliminada correctamente"});
    } catch (error) {
        res.status(500).json({message: "Error al eliminar solictud", error: error.message});
    }
};