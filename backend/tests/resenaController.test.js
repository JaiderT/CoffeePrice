import test from "node:test";
import assert from "node:assert/strict";
import Reseña from "../models/reseña.js";
import { createReseña } from "../controllers/reseña.js";
import { esIndiceUnicoSoloComprador } from "../utils/resenaIndexes.js";

function crearRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };
}

test("createReseña valida duplicados por productor autenticado y comprador", async () => {
  const originalExists = Reseña.exists;
  const productorAutenticado = "665000000000000000000001";
  const comprador = "665000000000000000000002";
  let consultaDuplicado = null;

  Reseña.exists = async (consulta) => {
    consultaDuplicado = consulta;
    return { _id: "reseña-existente" };
  };

  const req = {
    user: { id: productorAutenticado },
    body: {
      productor: "665000000000000000000099",
      comprador,
      calificacion: 5,
      comentario: "Excelente trato",
      tags: ["buen_trato"],
    },
  };
  const res = crearRes();

  await createReseña(req, res);

  assert.deepEqual(consultaDuplicado, { productor: productorAutenticado, comprador });
  assert.equal(res.statusCode, 400);
  assert.match(res.payload.message, /Ya has reseñado/i);

  Reseña.exists = originalExists;
});

test("createReseña crea la reseña con el productor del token", async () => {
  const originalExists = Reseña.exists;
  const originalSave = Reseña.prototype.save;
  const productorAutenticado = "665000000000000000000011";
  const comprador = "665000000000000000000012";
  let reseñaGuardada = null;

  Reseña.exists = async () => null;
  Reseña.prototype.save = async function save() {
    reseñaGuardada = this;
    return this;
  };

  const req = {
    user: { id: productorAutenticado },
    body: {
      productor: "665000000000000000000099",
      comprador,
      calificacion: 5,
      comentario: "Excelente trato",
      tags: ["buen_trato"],
    },
  };
  const res = crearRes();

  await createReseña(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(reseñaGuardada.productor.toString(), productorAutenticado);
  assert.equal(reseñaGuardada.comprador.toString(), comprador);

  Reseña.exists = originalExists;
  Reseña.prototype.save = originalSave;
});

test("esIndiceUnicoSoloComprador detecta solo el índice legacy", () => {
  assert.equal(esIndiceUnicoSoloComprador({ unique: true, key: { comprador: 1 } }), true);
  assert.equal(esIndiceUnicoSoloComprador({ unique: true, key: { productor: 1, comprador: 1 } }), false);
  assert.equal(esIndiceUnicoSoloComprador({ unique: false, key: { comprador: 1 } }), false);
});
