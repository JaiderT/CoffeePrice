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
const FNC_HISTORY_PATHS = [
    path.resolve(__dirname, "../../ml-service-experimental/datos/precios_fnc_historicos.csv"),
    path.resolve(__dirname, "../datos/precios_fnc_historicos.csv"),
];
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
            ? "Se proyecta una subida del precio del café en la próxima jornada."
            : "Hay señales de una posible subida en el precio del café.";
    }

    if (prediccion.tendencia === "baja") {
        return prediccion.confianza >= 70
            ? "Se proyecta una baja del precio del café en la próxima jornada."
            : "Hay señales de una posible baja en el precio del café.";
    }

    if (prediccion.tendencia === "estable") {
        return prediccion.confianza >= 70
            ? "Se espera estabilidad en el precio del café para la próxima jornada."
            : "El precio del café podría mantenerse estable en la próxima jornada.";
    }

    return "Se espera un comportamiento estable en el precio del café.";
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
        explicacion: "Predicción histórica generada por el modelo FNC híbrido.",
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

function parseCsvConEncabezados(contenido, camposRequeridos = []) {
    const lineas = contenido.trim().split(/\r?\n/).filter(Boolean);
    if (lineas.length < 2) return [];

    const encabezados = lineas[0].split(",").map((item) => item.trim());
    if (!camposRequeridos.every((campo) => encabezados.includes(campo))) {
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

export function parseCsvSimple(contenido) {
    return parseCsvConEncabezados(contenido, CAMPOS_HISTORIAL_FNC);
}

function esFechaIsoSimple(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function esNumeroFinito(value) {
    return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

function desplazarFechaIso(fecha, offsetDias) {
    const base = new Date(`${fecha}T00:00:00.000Z`);
    if (Number.isNaN(base.getTime())) return null;
    base.setUTCDate(base.getUTCDate() + offsetDias);
    return serializarFecha(base);
}

function buscarPrecioRealComparable(fecha, preciosRealesFnc) {
    if (!fecha || !(preciosRealesFnc instanceof Map)) return null;
    if (preciosRealesFnc.has(fecha)) return preciosRealesFnc.get(fecha);

    for (let offset = 1; offset <= 3; offset += 1) {
        const fechaSiguiente = desplazarFechaIso(fecha, offset);
        if (fechaSiguiente && preciosRealesFnc.has(fechaSiguiente)) {
            return preciosRealesFnc.get(fechaSiguiente);
        }
    }

    return null;
}

function calcularTendenciaReal(precioReal, precioBase) {
    const real = Number(precioReal);
    const base = Number(precioBase);

    if (!Number.isFinite(real) || !Number.isFinite(base) || base === 0) return null;

    const variacionCop = real - base;
    const variacionPct = (variacionCop / base) * 100;

    if (Math.abs(variacionCop) < 22000 || Math.abs(variacionPct) < 0.55) {
        return "estable";
    }

    return variacionPct > 0 ? "sube" : "baja";
}

function construirEvaluacionDesdePrecioReal(prediccion, precioReal) {
    if (!esNumeroFinito(precioReal) || !esNumeroFinito(prediccion?.precio_estimado)) {
        return null;
    }

    const real = Number(precioReal);
    const estimado = Number(prediccion.precio_estimado);
    const minimo = Number(prediccion.precio_minimo);
    const maximo = Number(prediccion.precio_maximo);
    const precioBase = Number(prediccion.precio_actual_fnc);
    const errorCop = estimado - real;
    const tendenciaReal = calcularTendenciaReal(real, precioBase);

    return {
        precio_real: real,
        error_cop: errorCop,
        error_abs: Math.abs(errorCop),
        error_pct: real !== 0 ? (Math.abs(errorCop) / real) * 100 : null,
        acerto_rango: Number.isFinite(minimo) && Number.isFinite(maximo) && real >= minimo && real <= maximo ? "1" : "0",
        tendencia_real: tendenciaReal,
        acerto_tendencia: tendenciaReal && prediccion.tendencia === tendenciaReal ? "1" : "0",
    };
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
            console.warn("predicciones_fnc.json inválido o incompleto. Se omite su lectura.");
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
        const preciosRealesFnc = await leerPreciosRealesFnc();

        return parseCsvSimple(contenido)
            .filter(esPrediccionHistoricaValida)
            .map((prediccion) =>
                normalizarPrediccionFncHistorica(
                    prediccion,
                    evaluaciones.get(prediccion.fecha_prediccion) ||
                        construirEvaluacionDesdePrecioReal(
                            prediccion,
                            buscarPrecioRealComparable(prediccion.fecha_prediccion, preciosRealesFnc)
                        )
                )
            );
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.warn("No se pudo leer historial_predicciones_fnc.csv:", error.message);
        }

        return [];
    }
}

async function leerPreciosRealesFnc() {
    for (const ruta of FNC_HISTORY_PATHS) {
        try {
            const contenido = await readFile(ruta, "utf8");
            const filas = parseCsvConEncabezados(contenido, ["ds", "y"]);
            const porFecha = new Map();

            for (const fila of filas) {
                if (esFechaIsoSimple(fila.ds) && esNumeroFinito(fila.y)) {
                    porFecha.set(fila.ds, Number(fila.y));
                }
            }

            if (porFecha.size > 0) return porFecha;
        } catch (error) {
            if (error.code !== "ENOENT") {
                console.warn(`No se pudo leer historial FNC ${ruta}:`, error.message);
            }
        }
    }

    return new Map();
}

async function leerEvaluacionPrediccionesFnc() {
    try {
        const contenido = await readFile(EVALUACION_PREDICCIONES_FNC_PATH, "utf8");
        const filas = parseCsvConEncabezados(contenido, [
            ...CAMPOS_HISTORIAL_FNC,
            "precio_real",
        ]).filter(esPrediccionHistoricaValida);
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
        const historica = porFecha.get(actual.fecha);
        if (historica?.tieneResultadoReal) {
            porFecha.set(actual.fecha, {
                ...actual,
                tieneResultadoReal: historica.tieneResultadoReal,
                precioReal: historica.precioReal,
                errorCop: historica.errorCop,
                errorAbsoluto: historica.errorAbsoluto,
                errorPorcentaje: historica.errorPorcentaje,
                acertoRango: historica.acertoRango,
                tendenciaReal: historica.tendenciaReal,
                acertoTendencia: historica.acertoTendencia,
            });
        } else {
            porFecha.set(actual.fecha, actual);
        }
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
                : "El precio del café podrá mantenerse estable en la próxima jornada.";
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
                message: "Debes consultar un rango válido de 7, 15 o 30 días"
            });
        }

        if (prediccionesFnc.length) {
            const prediccionesEvaluadas = prediccionesFnc.filter((item) => item.tieneResultadoReal);
            const baseRango = prediccionesEvaluadas.length ? prediccionesEvaluadas : prediccionesFnc;
            const prediccionesRango = baseRango.slice(-dias);
            return res.json({
                dias,
                total: prediccionesRango.length,
                generatedAt: prediccionesRango[prediccionesRango.length - 1].generatedAt,
                modelVersion: prediccionesRango[prediccionesRango.length - 1].modelVersion,
                fuente: "fnc_hibrido_historial",
                modo: prediccionesRango.length === 1 ? "prediccion_unica" : "historial_fnc",
                mensaje: "Historial real generado por el modelo FNC híbrido. Crece con cada ejecución diaria del pipeline.",
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
                message: "Debes consultar un día válido: 1, 7, 15 o 30"
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
                message: "No hay predicción disponible para ese día"
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
                message: "No hay predicción disponible para esa fecha"
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
            message: "Error al obtener predicción por fecha",
            error: error.message
        });
    }
};


export const getPrediccionById = async (req, res) => {
    try {
        const prediccion = await Prediccion.findById(req.params.id).lean();
        if (!prediccion) return res.status(404).json({ message: "Predicción no encontrada" });
        res.json(serializarPrediccion(prediccion));
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
        res.status(400).json({ message: "Error al crear predicción", error: error.message });
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

        if (!prediccion) return res.status(404).json({ message: "Predicción no encontrada" });
        res.json(prediccion); // Corrección: antes usaba res.jason
    } catch (error) {
        res.status(400).json({ message: "Error al actualizar predicción", error: error.message });
    }
};

export const deletePrediccion = async (req, res) => {
    try {
        const prediccion = await Prediccion.findByIdAndDelete(req.params.id);
        if (!prediccion) return res.status(404).json({ message: "Predicción no encontrada" });
        res.json({ message: "Predicción eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar predicción", error: error.message });
    }
};
