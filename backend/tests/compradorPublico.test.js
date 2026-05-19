import test from "node:test";
import assert from "node:assert/strict";
import { sanitizarCompradorPublico } from "../routes/comprador.js";

test("sanitizarCompradorPublico oculta telefono y direccion exacta", () => {
  const comprador = {
    _id: "cmp-1",
    nombreempresa: "Cafe Centro",
    tipoempresa: "independiente",
    municipio: "Pitalito",
    direccion: "Calle 1 # 2-3",
    telefono: "3001234567",
    horarioApertura: "07:00",
    horarioCierre: "17:00",
    descripcion: "Compra cafe pergamino",
    servicios: ["Pergamino seco"],
  };

  const publico = sanitizarCompradorPublico(comprador, { precioReferencia: 120000 });

  assert.equal(publico.direccion, null);
  assert.equal(publico.telefono, null);
  assert.equal(publico.contactoRestringido, true);
  assert.equal(publico.ubicacionGeneral, "Zona de Pitalito");
  assert.equal(publico.precioReferencia, 120000);
  assert.equal(typeof publico.latitud, "number");
  assert.equal(typeof publico.longitud, "number");
});
