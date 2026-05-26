import Prediccion from "../models/prediccion.js";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const TIME_ZONE = "America/Bogota";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PREDICCION_FNC_PATH = path.resolve(__dirname, "../datos/predicciones_fnc.json");
const HISTORIAL_PREDICCIONES_FNC_PATH = path.resolve(__dirname, "../datos/historial_predicciones_fnc.csv");
const EVALUACION_PREDICCIONES_FNC_PATH = path.resolve(
    __dirname,
    "../../ml-service-experimental/datos/evaluacion_predicciones_fnc.csv"
);
const CAMPOS_PREDICCION_FNC = [
    "fecha_prediccion",
    "precio_estimado",
    "precio_minimo",
    "precio_maximo",
    "tendencia",
];
const CAMPOS_HISTORIAL_FNC = [
    "fecha_prediccion",
    "precio_estimado",
    "precio_minimo",
    "precio_maximo",
];

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

function construirMensaje(prediccion) {
    if (prediccion.explicacion) return prediccion.explicacion;

    if (prediccion.tendencia === "sube") {
        return prediccion.confianza >= 70
            ? "Se proyecta una subida del precio del cafe en la proxima jornada."
            : "Hay senales de una posible subida en el precio del cafe.";
    }

    if (prediccion.tendencia === "baja") {
        return prediccion.confianza >= 70
            ? "Se proyecta una baja del precio del cafe en la proxima jornada."
            : "Hay senales de una posible baja en el precio del cafe.";
    }

    if (prediccion.tendencia === "estable") {
        return prediccion.confianza >= 70
            ? "Se espera estabilidad en el precio del cafe para la proxima jornada."
            : "El precio del cafe podria mantenerse estable en la proxima jornada.";
    }

    return "Se espera un comportamiento estable en el precio del cafe.";
}

function calcularConfianzaDesdeFnc(prediccion) {
    const mape = Number(prediccion.holdout_mape);

    if (prediccion.precio_minimo === prediccion.precio_maximo) {
        return 92;
    }

    if (Number.isFinite(mape)) {
        return Math.max(45, Math.min(90, Math.round(92 - (mape * 10))));
    }

    return 65;
}

function normalizarPrediccionFnc(prediccion) {
    const confianza = calcularConfianzaDesdeFnc(prediccion);

    return {
        fecha: prediccion.fecha_prediccion,
        precioestimado: prediccion.precio_estimado,
        preciominimo: prediccion.precio_minimo,
        preciomaximo: prediccion.precio_maximo,
        tendencia: prediccion.tendencia,
        confianza,
        generatedAt: prediccion.generatedAt || prediccion.fecha_actual,
        modelVersion: prediccion.modelo || "fnc_hibrido",
        fuente: "fnc_hibrido_json",
        mensaje: construirMensaje({
            tendencia: prediccion.tendencia,
            confianza,
            explicacion: prediccion.explicacion,
        }),
        fechaActual: prediccion.fecha_actual,
        precioActualFnc: prediccion.precio_actual_fnc,
        variacionPorcentual: prediccion.variacion_porcentual,
        estrategiaBase: prediccion.estrategia_base,
        estrategiaAplicada: prediccion.estrategia_aplicada,
        holdoutMape: prediccion.holdout_mape,
        holdoutMae: prediccion.holdout_mae,
        explicacion: prediccion.explicacion,
        senalesModelo: prediccion.senales_modelo,
    };
}

function normalizarPrediccionFncHistorica(prediccion, evaluacion = null) {
    const adaptada = {
        fecha_prediccion: prediccion.fecha_prediccion,
        precio_estimado: Number(prediccion.precio_estimado),
        precio_minimo: Number(prediccion.precio_minimo),
        precio_maximo: Number(prediccion.precio_maximo),
        tendencia: prediccion.tendencia || "estable",
        modelo: prediccion.modelo || "fnc_hibrido",
        fecha_actual: prediccion.fecha_generacion,
        precio_actual_fnc: Number(prediccion.precio_actual_fnc),
        variacion_porcentual: Number(prediccion.variacion_porcentual),
        estrategia_base: prediccion.estrategia_base,
        estrategia_aplicada: prediccion.estrategia,
        holdout_mape: Number(prediccion.holdout_mape),
        holdout_mae: Number(prediccion.holdout_mae),
        explicacion: "Prediccion historica generada por el modelo FNC hibrido.",
    };

    const tienePrecioReal = esNumeroFinito(evaluacion?.precio_real);

    return {
        ...normalizarPrediccionFnc(adaptada),
        fuente: "fnc_hibrido_historial",
        fechaGeneracion: prediccion.fecha_generacion,
        fechaPrediccionOriginal: prediccion.fecha_prediccion_original,
        saltoFinSemana: Boolean(Number(prediccion.salto_fin_semana || 0)),
        tieneResultadoReal: tienePrecioReal,
        precioReal: tienePrecioReal ? Number(evaluacion.precio_real) : null,
        errorCop: esNumeroFinito(evaluacion?.error_cop) ? Number(evaluacion.error_cop) : null,
        errorAbsoluto: esNumeroFinito(evaluacion?.error_abs) ? Number(evaluacion.error_abs) : null,
        errorPorcentaje: esNumeroFinito(evaluacion?.error_pct) ? Number(evaluacion.error_pct) : null,
        acertoRango: evaluacion?.acerto_rango === "1",
        tendenciaReal: evaluacion?.tendencia_real || null,
        acertoTendencia: evaluacion?.acerto_tendencia === "1",
    };
}

export function parseCsvSimple(contenido) {
    const lineas = contenido.trim().split(/\r?\n/).filter(Boolean);
    if (lineas.length < 2) return [];

    const encabezados = lineas[0].split(",").map((item) => item.trim());
    if (!CAMPOS_HISTORIAL_FNC.every((campo) => encabezados.includes(campo))) {
        return [];
    }

    return lineas.slice(1).map((linea) => {
        const valores = linea.split(",");
        if (valores.length < encabezados.length) {
            return null;
        }
        return encabezados.reduce((registro, encabezado, index) => {
            registro[encabezado] = valores[index] ?? "";
            return registro;
        }, {});
    }).filter(Boolean);
}

function esFechaIsoSimple(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function esNumeroFinito(value) {
    return Number.isFinite(Number(value));
}

export function esPrediccionFncValida(prediccion) {
    if (!prediccion || typeof prediccion !== "object") return false;
    if (!CAMPOS_PREDICCION_FNC.every((campo) => campo in prediccion)) return false;
    if (!esFechaIsoSimple(prediccion.fecha_prediccion)) return false;
    if (!["sube", "baja", "estable"].includes(prediccion.tendencia)) return false;
    return (
        esNumeroFinito(prediccion.precio_estimado) &&
        esNumeroFinito(prediccion.precio_minimo) &&
        esNumeroFinito(prediccion.precio_maximo)
    );
}

export function esPrediccionHistoricaValida(prediccion) {
    if (!prediccion || typeof prediccion !== "object") return false;
    if (!esFechaIsoSimple(prediccion.fecha_prediccion)) return false;
    return (
        esNumeroFinito(prediccion.precio_estimado) &&
        esNumeroFinito(prediccion.precio_minimo) &&
        esNumeroFinito(prediccion.precio_maximo)
    );
}

async function leerPrediccionFnc() {
    try {
        const contenido = await readFile(PREDICCION_FNC_PATH, "utf8");
        const prediccion = JSON.parse(contenido);

        if (!esPrediccionFncValida(prediccion)) {
            console.warn("predicciones_fnc.json invalido o incompleto. Se omite su lectura.");
            return null;
        }

        return normalizarPrediccionFnc(prediccion);
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.warn("No se pudo leer predicciones_fnc.json:", error.message);
        }

        return null;
    }
}

async function leerHistorialPrediccionesFnc() {
    try {
        const contenido = await readFile(HISTORIAL_PREDICCIONES_FNC_PATH, "utf8");
        const evaluaciones = await leerEvaluacionPrediccionesFnc();

        return parseCsvSimple(contenido)
            .filter(esPrediccionHistoricaValida)
            .map((prediccion) =>
                normalizarPrediccionFncHistorica(
                    prediccion,
                    evaluaciones.get(prediccion.fecha_prediccion) || null
                )
            );
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.warn("No se pudo leer historial_predicciones_fnc.csv:", error.message);
        }

        return [];
    }
}

async function leerEvaluacionPrediccionesFnc() {
    try {
        const contenido = await readFile(EVALUACION_PREDICCIONES_FNC_PATH, "utf8");
        const filas = parseCsvSimple(contenido).filter(esPrediccionHistoricaValida);
        const porFecha = new Map();

        for (const fila of filas) {
            porFecha.set(fila.fecha_prediccion, fila);
        }

        return porFecha;
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.warn("No se pudo leer evaluacion_predicciones_fnc.csv:", error.message);
        }

        return new Map();
    }
}

function ordenarPrediccionesPorFecha(predicciones) {
    return [...predicciones].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
}

async function leerPrediccionesFncDisponibles() {
    const historial = await leerHistorialPrediccionesFnc();
    const actual = await leerPrediccionFnc();
    const porFecha = new Map();

    for (const prediccion of historial) {
        porFecha.set(prediccion.fecha, prediccion);
    }

    if (actual) {
        porFecha.set(actual.fecha, actual);
    }

    return ordenarPrediccionesPorFecha([...porFecha.values()]);
}

function fechaCoincide(fechaA, fechaB) {
    return fechaA && fechaB && fechaA === fechaB;
}

function filtroModeloFncHibrido(extra = {}) {
    return {
        modelVersion: "fnc_hibrido",
        ...extra,
    };
}

export const getPredicciones = async (req, res) => {
    try {
        const prediccionesFnc = await leerPrediccionesFncDisponibles();
        if (prediccionesFnc.length) {
            return res.json(prediccionesFnc);
        }

        const predicciones = await Prediccion.find(filtroModeloFncHibrido()).sort({ fecha: -1 }).lean();
        res.json(predicciones.map(serializarPrediccion));
    } catch (error) {
        res.status(500).json({ message: "Error al obtener predicciones", error: error.message });
    }
};

export const getUltimaPrediccion = async (req, res) => {
    try {
        const prediccionFnc = await leerPrediccionFnc();
        if (prediccionFnc) return res.json(prediccionFnc);

        const prediccion = await Prediccion.findOne(filtroModeloFncHibrido()).sort({ fecha: -1 }).lean();
        if (!prediccion) return res.status(404).json({ message: "No hay predicciones disponibles" });
        res.json(serializarPrediccion(prediccion));
    } catch (error) {
        res.status(500).json({ message: "Error al obtener ultima prediccion", error: error.message });
    }
};
export const getResumenPredicciones = async (req, res) => {
    try {
        const prediccionFnc = await leerPrediccionFnc();
        if (prediccionFnc) return res.json(prediccionFnc);

        const manana = obtenerFechaBogota(1);
        const pasadoManana = obtenerFechaBogota(2);

        const prediccion = await Prediccion.findOne(filtroModeloFncHibrido({
            fecha: {
                $gte: manana,
                $lt: pasadoManana
            }
        })).sort({ fecha: 1 }).lean();


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
            mensaje: construirMensaje(prediccion),
            fuente: "mongo",
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
        const prediccionesFnc = await leerPrediccionesFncDisponibles();

        const diasPermitidos = [7, 15, 30];

        if (!diasPermitidos.includes(dias)) {
            return res.status(400).json({
                message: "Debes consultar un rango valido de 7, 15 o 30 dias"
            });
        }

        if (prediccionesFnc.length) {
            const prediccionesRango = prediccionesFnc.slice(-dias);
            return res.json({
                dias,
                total: prediccionesRango.length,
                generatedAt: prediccionesRango[prediccionesRango.length - 1].generatedAt,
                modelVersion: prediccionesRango[prediccionesRango.length - 1].modelVersion,
                fuente: "fnc_hibrido_historial",
                modo: prediccionesRango.length === 1 ? "prediccion_unica" : "historial_fnc",
                mensaje: "Historial real generado por el modelo FNC hibrido. Crece con cada ejecucion diaria del pipeline.",
                predicciones: prediccionesRango,
            });
        }

        const hoy = obtenerFechaBogota(0);

        const predicciones = await Prediccion.find(filtroModeloFncHibrido({
            fecha: { $gte: hoy }
        }))
            .sort({ fecha: 1 })
            .limit(dias)
            .lean();

        const prediccionesCombinadas = predicciones.map(serializarPrediccion);

        if (!prediccionesCombinadas.length) {
            return res.status(404).json({
                message: "No hay predicciones disponibles para ese rango"
            });
        }

        res.json({
            dias,
            total: prediccionesCombinadas.length,
            generatedAt: prediccionesCombinadas[0].generatedAt,
            modelVersion: prediccionesCombinadas[0].modelVersion,
            fuente: "mongo",
            predicciones: prediccionesCombinadas,
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
        const fechaConsulta = serializarFecha(fechaInicio);
        const prediccionesFnc = await leerPrediccionesFncDisponibles();
        const prediccionFnc = prediccionesFnc.find((item) => fechaCoincide(item.fecha, fechaConsulta));

        if (prediccionFnc) {
            return res.json({
                offset,
                ...prediccionFnc,
            });
        }

        const fechaFin = new Date(fechaInicio);
        fechaFin.setUTCDate(fechaFin.getUTCDate() + 1);

        const prediccion = await Prediccion.findOne(filtroModeloFncHibrido({
            fecha: {
                $gte: fechaInicio,
                $lt: fechaFin
            }
        })).lean();


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

        const prediccionesFnc = await leerPrediccionesFncDisponibles();
        const prediccionFnc = prediccionesFnc.find((item) => fechaCoincide(item.fecha, fecha));

        if (prediccionFnc) {
            return res.json(prediccionFnc);
        }

        const fechaInicio = new Date(`${fecha}T00:00:00.000Z`);
        if (isNaN(fechaInicio.getTime())) {
            return res.status(400).json({
                message: "La fecha enviada no es valida"
            });
        }

        const fechaFin = new Date(fechaInicio);
        fechaFin.setUTCDate(fechaFin.getUTCDate() + 1);

        const prediccion = await Prediccion.findOne(filtroModeloFncHibrido({
            fecha: {
                $gte: fechaInicio,
                $lt: fechaFin
            }
        })).lean();

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
        res.json(prediccion); // Correccion: antes usaba res.jason
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
