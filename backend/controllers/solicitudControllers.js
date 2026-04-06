import Solicitud from "../models/solicitud.js";
import Comprador from "../models/comprador.js";

export const getSolicitudesByProductor = async (req, res) => {
    try {
        const esAdmin = req.user?.rol === "admin";
        const esPropietario = req.params.productorId === req.user.id;

        if (!esAdmin && !esPropietario) {
            return res.status(403).json({
                message: "No tienes permisos para ver estas solicitudes"
            });
        }

        const solicitudes = await Solicitud.find({ productor: req.params.productorId })
            .populate("comprador", "nombreempresa tipo direccion")
            .sort({ createdAt: -1 });

        res.json(solicitudes);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener solicitudes", error: error.message });
    }
};


export const getSolicitudesByComprador = async (req, res) => {
    try {
        const compradorExistente = await Comprador.findById(req.params.compradorId);

        if (!compradorExistente) {
            return res.status(404).json({ message: "Comprador no encontrado" });
        }

        const esAdmin = req.user?.rol === "admin";
        const esPropietario = compradorExistente.usuario.toString() === req.user.id;

        if (!esAdmin && !esPropietario) {
            return res.status(403).json({
                message: "No tienes permisos para ver estas solicitudes"
            });
        }

        const solicitudes = await Solicitud.find({ comprador: req.params.compradorId })
            .populate("productor", "nombre apellido celular")
            .sort({ createdAt: -1 });

        res.json(solicitudes);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener solicitudes del comprador", error: error.message });
    }
};


export const getSolicitudById = async (req, res) => {
    try {
        const solicitud = await Solicitud.findById(req.params.id)
            .populate("productor", "nombre apellido celular")
            .populate("comprador", "nombreempresa tipo direccion usuario");

        if (!solicitud) {
            return res.status(404).json({ message: "Solicitud no encontrada" });
        }

        const esAdmin = req.user?.rol === "admin";
        const esProductor = solicitud.productor?._id?.toString() === req.user.id;
        const esComprador = solicitud.comprador?.usuario?.toString() === req.user.id;

        if (!esAdmin && !esProductor && !esComprador) {
            return res.status(403).json({
                message: "No tienes permisos para ver esta solicitud"
            });
        }

        res.json(solicitud);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener solicitud", error: error.message });
    }
};


export const createSolicitud = async (req, res) => {
    try {
        const { comprador, cantidadcargas, tipocafe, mensaje } = req.body;

        const solicitud = new Solicitud({
            productor: req.user.id,
            comprador,
            cantidadcargas,
            tipocafe,
            mensaje
        });

        await solicitud.save();

        res.status(201).json(solicitud);
    } catch (error) {
        res.status(400).json({ message: "Error al crear solicitud", error: error.message });
    }
};

export const responderSolicitud = async (req, res) => {
    try {
        const { respuestaComprador } = req.body;

        if (!respuestaComprador || !respuestaComprador.trim()) {
            return res.status(400).json({
                message: "La respuesta del comprador es obligatoria"
            });
        }

        const solicitud = await Solicitud.findById(req.params.id);

        if (!solicitud) {
            return res.status(404).json({ message: "Solicitud no encontrada" });
        }

        const compradorExistente = await Comprador.findById(solicitud.comprador);

        if (!compradorExistente) {
            return res.status(404).json({ message: "Comprador asociado no encontrado" });
        }

        const esAdmin = req.user?.rol === "admin";
        const esPropietario = compradorExistente.usuario.toString() === req.user.id;

        if (!esAdmin && !esPropietario) {
            return res.status(403).json({
                message: "No tienes permisos para responder esta solicitud"
            });
        }

        solicitud.respuestaComprador = respuestaComprador;
        solicitud.fechaRespuesta = new Date();
        solicitud.estado = "respondida";

        await solicitud.save();

        res.json({
            message: "Solicitud respondida correctamente",
            solicitud
        });
    } catch (error) {
        res.status(400).json({
            message: "Error al responder solicitud",
            error: error.message
        });
    }
};

export const cerrarSolicitud = async (req, res) => {
    try {
        const solicitud = await Solicitud.findById(req.params.id);

        if (!solicitud) {
            return res.status(404).json({ message: "Solicitud no encontrada" });
        }

        const compradorExistente = await Comprador.findById(solicitud.comprador);

        if (!compradorExistente) {
            return res.status(404).json({ message: "Comprador asociado no encontrado" });
        }

        const esAdmin = req.user?.rol === "admin";
        const esPropietario = compradorExistente.usuario.toString() === req.user.id;

        if (!esAdmin && !esPropietario) {
            return res.status(403).json({
                message: "No tienes permisos para cerrar esta solicitud"
            });
        }

        solicitud.estado = "cerrada";
        await solicitud.save();

        res.json({
            message: "Solicitud cerrada correctamente",
            solicitud
        });
    } catch (error) {
        res.status(400).json({
            message: "Error al cerrar solicitud",
            error: error.message
        });
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