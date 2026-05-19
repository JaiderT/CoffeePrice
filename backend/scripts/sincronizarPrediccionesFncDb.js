import "dotenv/config";
import "../config/env.js";
import mongoose from "mongoose";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Prediccion from "../models/prediccion.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATOS_DIR = path.resolve(__dirname, "../datos");
const PREDICCION_JSON_PATH = path.join(DATOS_DIR, "predicciones_fnc.json");
const HISTORIAL_CSV_PATH = path.join(DATOS_DIR, "historial_predicciones_fnc.csv");

function parseCsvSimple(contenido) {
  const lineas = contenido.trim().split(/\r?\n/).filter(Boolean);
  if (lineas.length < 2) return [];

  const encabezados = lineas[0].split(",").map((item) => item.trim());
  return lineas.slice(1).map((linea) => {
    const valores = linea.split(",");
    return encabezados.reduce((registro, encabezado, index) => {
      registro[encabezado] = valores[index] ?? "";
      return registro;
    }, {});
  });
}

function esFechaIsoSimple(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function esNumeroFinito(value) {
  return Number.isFinite(Number(value));
}

function confianzaDesdeMape(mape, minimo, maximo) {
  if (Number(minimo) === Number(maximo)) return 92;
  const numero = Number(mape);
  if (Number.isFinite(numero)) {
    return Math.max(45, Math.min(90, Math.round(92 - (numero * 10))));
  }
  return 65;
}

function aFechaUtc(fechaIso) {
  return new Date(`${fechaIso}T00:00:00.000Z`);
}

function normalizarDocumentoDesdeJson(prediccion) {
  if (
    !prediccion ||
    !esFechaIsoSimple(prediccion.fecha_prediccion) ||
    !["sube", "baja", "estable"].includes(prediccion.tendencia) ||
    !esNumeroFinito(prediccion.precio_estimado) ||
    !esNumeroFinito(prediccion.precio_minimo) ||
    !esNumeroFinito(prediccion.precio_maximo)
  ) {
    return null;
  }

  return {
    fecha: aFechaUtc(prediccion.fecha_prediccion),
    precioestimado: Number(prediccion.precio_estimado),
    preciominimo: Number(prediccion.precio_minimo),
    preciomaximo: Number(prediccion.precio_maximo),
    tendencia: prediccion.tendencia,
    confianza: confianzaDesdeMape(
      prediccion.holdout_mape,
      prediccion.precio_minimo,
      prediccion.precio_maximo
    ),
    generatedAt: prediccion.fecha_actual ? aFechaUtc(prediccion.fecha_actual) : new Date(),
    modelVersion: prediccion.modelo || "fnc_hibrido",
  };
}

function normalizarDocumentoDesdeHistorial(fila) {
  if (
    !esFechaIsoSimple(fila.fecha_prediccion) ||
    !esNumeroFinito(fila.precio_estimado) ||
    !esNumeroFinito(fila.precio_minimo) ||
    !esNumeroFinito(fila.precio_maximo)
  ) {
    return null;
  }

  return {
    fecha: aFechaUtc(fila.fecha_prediccion),
    precioestimado: Number(fila.precio_estimado),
    preciominimo: Number(fila.precio_minimo),
    preciomaximo: Number(fila.precio_maximo),
    tendencia: fila.tendencia || "estable",
    confianza: confianzaDesdeMape(fila.holdout_mape, fila.precio_minimo, fila.precio_maximo),
    generatedAt: esFechaIsoSimple(fila.fecha_generacion) ? aFechaUtc(fila.fecha_generacion) : new Date(),
    modelVersion: fila.modelo || "fnc_hibrido",
  };
}

async function cargarDocumentosFnc() {
  const historialContenido = await readFile(HISTORIAL_CSV_PATH, "utf8");
  const historial = parseCsvSimple(historialContenido)
    .map(normalizarDocumentoDesdeHistorial)
    .filter(Boolean);

  const actualContenido = await readFile(PREDICCION_JSON_PATH, "utf8");
  const actual = normalizarDocumentoDesdeJson(JSON.parse(actualContenido));

  const porFecha = new Map();
  for (const doc of historial) {
    porFecha.set(doc.fecha.toISOString(), doc);
  }
  if (actual) {
    porFecha.set(actual.fecha.toISOString(), actual);
  }

  return [...porFecha.values()];
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const docs = await cargarDocumentosFnc();
  let upserts = 0;

  for (const doc of docs) {
    await Prediccion.updateOne(
      { fecha: doc.fecha, modelVersion: "fnc_hibrido" },
      { $set: doc },
      { upsert: true }
    );
    upserts += 1;
  }

  const eliminacion = await Prediccion.deleteMany({
    modelVersion: { $ne: "fnc_hibrido" },
  });

  const resumen = await Prediccion.aggregate([
    { $group: { _id: "$modelVersion", total: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  console.log(
    JSON.stringify(
      {
        upserts,
        eliminadosModeloViejo: eliminacion.deletedCount,
        resumen,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {}
  });
