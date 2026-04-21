import Prediccion from "../models/prediccion.js";

const TIME_ZONE = "America/Bogota";

function obtenerFechaBogota(offsetDias = 0) {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());

    const year = Number(partes.find((p) => p.type === "year")?.value);
    const month = Number(partes.find((p) => p.type === "month")?.value);
    const day = Number(partes.find((p) => p.type === "day")?.value);

    const fechaUtc = new Date(Date.UTC(year, month - 1, day + offsetDias));
    return fechaUtc;
}

function serializarFecha(fecha) {
    return new Date(fecha).toISOString().slice(0, 10);
}

function serializarPrediccion(prediccion) {
    return {
        ...prediccion,
        fecha: serializarFecha(prediccion.fecha),
    };
}

export const getPredicciones = async (req, res) => {
    try {
        const predicciones = await Prediccion.find().sort({ fecha: -1 }).lean();
        res.json(predicciones.map(serializarPrediccion));
    } catch (error) {
        res.status(500).json({ message: "Error al obtener predicciones", error: error.message });
    }
};

export const getUltimaPrediccion = async (req, res) => {
    try {
        const prediccion = await Prediccion.findOne().sort({ fecha: -1 }).lean();
        if (!prediccion) return res.status(404).json({ message: "No hay predicciones disponibles" });
        res.json(serializarPrediccion(prediccion));
    } catch (error) {
        res.status(500).json({ message: "Error al obtener ultima prediccion", error: error.message });
    }
};
export const getResumenPredicciones = async (req, res) => {
    try {
        const manana = obtenerFechaBogota(1);
        const pasadoManana = obtenerFechaBogota(2);

        const prediccion = await Prediccion.findOne({
            fecha: {
                $gte: manana,
                $lt: pasadoManana
            }
        }).sort({ fecha: 1 }).lean();


        if (!prediccion) {
            return res.status(404).json({
                message: "No hay predicciones disponibles"
            });
        }

        let mensaje = "Se espera un comportamiento estable en el precio del cafe.";

        if (prediccion.tendencia === "sube") {
            mensaje = prediccion.confianza >= 70
                ? "Se proyecta una subida del precio del cafe en la proxima jornada."
                : "Hay señales de una posible subida en el precio del cafe.";
        } else if (prediccion.tendencia === "baja") {
            mensaje = prediccion.confianza >= 70
                ? "Se proyecta una baja del precio del cafe en la proxima jornada."
                : "Hay señales de una posible baja en el precio del cafe.";
        } else if (prediccion.tendencia === "estable") {
            mensaje = prediccion.confianza >= 70
                ? "Se espera estabilidad en el precio del cafe para la proxima jornada."
                : "El precio del cafe podra mantenerse estable en la proxima jornada.";
        }

        res.json({
            fecha: serializarFecha(prediccion.fecha),
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
                message: "Debes consultar un rango valido de 7, 15 o 30 dias"
            });
        }

        const hoy = obtenerFechaBogota(0);

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
            predicciones: predicciones.map((item) => serializarPrediccion(item.toObject ? item.toObject() : item)),
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
                message: "Debes consultar un dia valido: 1, 7, 15 o 30"
            });
        }

        const fechaInicio = obtenerFechaBogota(offset);

        const fechaFin = new Date(fechaInicio);
        fechaFin.setUTCDate(fechaFin.getUTCDate() + 1);

        const prediccion = await Prediccion.findOne({
            fecha: {
                $gte: fechaInicio,
                $lt: fechaFin
            }
        }).lean();


        if (!prediccion) {
            return res.status(404).json({
                message: "No hay prediccion disponible para ese dia"
            });
        }

        res.json({
            offset,
            fecha: serializarFecha(prediccion.fecha),
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
            message: "Error al obtener prediccion por dia",
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

        const fechaInicio = new Date(`${fecha}T00:00:00.000Z`);
        if (isNaN(fechaInicio.getTime())) {
            return res.status(400).json({
                message: "La fecha enviada no es valida"
            });
        }

        const fechaFin = new Date(fechaInicio);
        fechaFin.setUTCDate(fechaFin.getUTCDate() + 1);

        const prediccion = await Prediccion.findOne({
            fecha: {
                $gte: fechaInicio,
                $lt: fechaFin
            }
        }).lean();

        if (!prediccion) {
            return res.status(404).json({
                message: "No hay prediccion disponible para esa fecha"
            });
        }

        res.json({
            fecha: serializarFecha(prediccion.fecha),
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
            message: "Error al obtener prediccion por fecha",
            error: error.message
        });
    }
};


export const getPrediccionById = async (req, res) => {
    try {
        const prediccion = await Prediccion.findById(req.params.id).lean();
        if (!prediccion) return res.status(404).json({ message: "Prediccion no encontrada" });
        res.json(serializarPrediccion(prediccion));
    } catch (error) {
        res.status(500).json({ message: "Error al obtener prediccion", error: error.message });
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
        res.json(prediccion); // âœ… era res.jason
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
