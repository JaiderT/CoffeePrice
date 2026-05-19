import test from "node:test";
import assert from "node:assert/strict";
import {
  esPrediccionFncValida,
  esPrediccionHistoricaValida,
  parseCsvSimple,
} from "../controllers/prediccionControllers.js";

test("esPrediccionFncValida acepta estructura minima esperada", () => {
  const prediccion = {
    fecha_prediccion: "2026-05-19",
    precio_estimado: 123456,
    precio_minimo: 120000,
    precio_maximo: 126000,
    tendencia: "sube",
  };

  assert.equal(esPrediccionFncValida(prediccion), true);
});

test("esPrediccionFncValida rechaza tendencia invalida", () => {
  const prediccion = {
    fecha_prediccion: "2026-05-19",
    precio_estimado: 123456,
    precio_minimo: 120000,
    precio_maximo: 126000,
    tendencia: "rompe",
  };

  assert.equal(esPrediccionFncValida(prediccion), false);
});

test("esPrediccionHistoricaValida rechaza fila sin fecha ISO", () => {
  const fila = {
    fecha_prediccion: "19/05/2026",
    precio_estimado: "123456",
    precio_minimo: "120000",
    precio_maximo: "126000",
  };

  assert.equal(esPrediccionHistoricaValida(fila), false);
});

test("parseCsvSimple rechaza CSV sin encabezados requeridos", () => {
  const csv = "fecha,valor\n2026-05-19,123";
  assert.deepEqual(parseCsvSimple(csv), []);
});
