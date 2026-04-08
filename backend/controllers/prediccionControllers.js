import Prediccion from "../models/prediccion.js";

export const getPredicciones = async (req, res) => {
    try {
        const predicciones = await Prediccion.find().sort({ fecha: -1 });
        res.json(predicciones);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener predicciones", error: error.message });
    }
};

export const getUltimaPrediccion = async (req, res) => {
    try {
        const prediccion = await Prediccion.findOne().sort({ fecha: -1 });
        if (!prediccion) return res.status(404).json({ message: "No hay predicciones disponibles" });
        res.json(prediccion);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener ultima prediccion", error: error.message });
    }
};
export const getResumenPredicciones = async (req, res) => {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const prediccion = await Prediccion.findOne({
            fecha: { $gte: hoy }
        }).sort({ fecha: 1 });
        let mensaje = "Se espera un comportamiento estable en el precio del café.";

        if (prediccion.tendencia === "sube") {
            mensaje = prediccion.confianza >= 70
                ? "Se proyecta una subida del precio del café en la próxima jornada."
                : "Hay señales de una posible subida en el precio del café.";
        } else if (prediccion.tendencia === "baja") {
            mensaje = prediccion.confianza >= 70
                ? "Se proyecta una baja del precio del café en la próxima jornada."
                : "Hay señales de una posible baja en el precio del café.";
        } else if (prediccion.tendencia === "estable") {
            mensaje = prediccion.confianza >= 70
                ? "Se espera estabilidad en el precio del café para la próxima jornada."
                : "El precio del café podría mantenerse estable en la próxima jornada.";
        }

        if (!prediccion) {
            return res.status(404).json({
                message: "No hay predicciones disponibles"
            });
        }

        res.json({
            fecha: prediccion.fecha,
            precioestimado: prediccion.precioestimado,
            preciominimo: prediccion.preciominimo,
            preciomaximo: prediccion.preciomaximo,
            tendencia: prediccion.tendencia,
            confianza: prediccion.confianza,
            generatedAt: prediccion.generatedAt,
            modelVersion: prediccion.modelVersion,
            mensaje,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener el resumen de predicciones",
            error: error.message
        });
    }
};
export const getPrediccionesPorRango = async (req, res) => {
    try {
        const dias = Number(req.query.dias);

        const diasPermitidos = [7, 15, 30];

        if (!diasPermitidos.includes(dias)) {
            return res.status(400).json({
                message: "Debes consultar un rango válido de 7, 15 o 30 días"
            });
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const predicciones = await Prediccion.find({
            fecha: { $gte: hoy }
        })
            .sort({ fecha: 1 })
            .limit(dias);

        if (!predicciones.length) {
            return res.status(404).json({
                message: "No hay predicciones disponibles para ese rango"
            });
        }

        res.json({
            dias,
            total: predicciones.length,
            generatedAt: predicciones[0].generatedAt,
            modelVersion: predicciones[0].modelVersion,
            predicciones,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener predicciones por rango",
            error: error.message
        });
    }
};
export const getPrediccionPorDia = async (req, res) => {
    try {
        const offset = Number(req.query.offset);

        const offsetsPermitidos = [1, 7, 15, 30];

        if (!offsetsPermitidos.includes(offset)) {
            return res.status(400).json({
                message: "Debes consultar un día válido: 1, 7, 15 o 30"
            });
        }

        const fechaInicio = new Date();
        fechaInicio.setHours(0, 0, 0, 0);
        fechaInicio.setDate(fechaInicio.getDate() + offset);

        const fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + 1);

        const prediccion = await Prediccion.findOne({
            fecha: {
                $gte: fechaInicio,
                $lt: fechaFin
            }
        });


        if (!prediccion) {
            return res.status(404).json({
                message: "No hay predicción disponible para ese día"
            });
        }

        res.json({
            offset,
            fecha: prediccion.fecha,
            precioestimado: prediccion.precioestimado,
            preciominimo: prediccion.preciominimo,
            preciomaximo: prediccion.preciomaximo,
            tendencia: prediccion.tendencia,
            confianza: prediccion.confianza,
            generatedAt: prediccion.generatedAt,
            modelVersion: prediccion.modelVersion,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener predicción por día",
            error: error.message
        });
    }
};
export const getPrediccionPorFecha = async (req, res) => {
    try {
        const { fecha } = req.query;

        if (!fecha) {
            return res.status(400).json({
                message: "Debes enviar una fecha en formato YYYY-MM-DD"
            });
        }

        const fechaInicio = new Date(fecha);
        if (isNaN(fechaInicio.getTime())) {
            return res.status(400).json({
                message: "La fecha enviada no es válida"
            });
        }

        fechaInicio.setHours(0, 0, 0, 0);

        const fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + 1);

        const prediccion = await Prediccion.findOne({
            fecha: {
                $gte: fechaInicio,
                $lt: fechaFin
            }
        });

        if (!prediccion) {
            return res.status(404).json({
                message: "No hay predicción disponible para esa fecha"
            });
        }

        res.json({
            fecha: prediccion.fecha,
            precioestimado: prediccion.precioestimado,
            preciominimo: prediccion.preciominimo,
            preciomaximo: prediccion.preciomaximo,
            tendencia: prediccion.tendencia,
            confianza: prediccion.confianza,
            generatedAt: prediccion.generatedAt,
            modelVersion: prediccion.modelVersion,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener predicción por fecha",
            error: error.message
        });
    }
};


export const getPrediccionById = async (req, res) => {
    try {
        const prediccion = await Prediccion.findById(req.params.id);
        if (!prediccion) return res.status(404).json({ message: "Predicción no encontrada" });
        res.json(prediccion);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener predicción", error: error.message });
    }
};

export const createPrediccion = async (req, res) => {
    try {
        const { fecha, precioestimado, preciominimo, preciomaximo, tendencia, confianza } = req.body;

        const prediccion = new Prediccion({
            fecha,
            precioestimado,
            preciominimo,
            preciomaximo,
            tendencia,
            confianza,
        });

        await prediccion.save();
        res.status(201).json(prediccion);
    } catch (error) {
        res.status(400).json({ message: "Error al crear prediccion", error: error.message });
    }
};

export const updatePrediccion = async (req, res) => {
    try {
        const { fecha, precioestimado, preciominimo, preciomaximo, tendencia, confianza } = req.body;

        const prediccion = await Prediccion.findByIdAndUpdate(
            req.params.id,
            { fecha, precioestimado, preciominimo, preciomaximo, tendencia, confianza },
            { new: true, runValidators: true }
        );

        if (!prediccion) return res.status(404).json({ message: "Prediccion no encontrada" });
        res.json(prediccion); // ✅ era res.jason
    } catch (error) {
        res.status(400).json({ message: "Error al actualizar prediccion", error: error.message });
    }
};

export const deletePrediccion = async (req, res) => {
    try {
        const prediccion = await Prediccion.findByIdAndDelete(req.params.id);
        if (!prediccion) return res.status(404).json({ message: "Prediccion no encontrada" });
        res.json({ message: "Prediccion eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar prediccion", error: error.message });
    }
};