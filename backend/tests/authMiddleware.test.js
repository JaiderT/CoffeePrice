import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import Usuario from "../models/usuario.js";
import authMiddleware, { rutaPermitidaParaEstado } from "../middlewares/authMiddleware.js";

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

test("rutaPermitidaParaEstado permite reactivar suspendido", () => {
  const req = { originalUrl: "/api/usuario/reactivar" };
  assert.equal(rutaPermitidaParaEstado(req, "suspendido", "productor"), true);
});

test("authMiddleware bloquea cuenta suspendida fuera de rutas permitidas", async () => {
  const originalVerify = jwt.verify;
  const originalFindById = Usuario.findById;

  jwt.verify = () => ({ id: "user-1" });
  Usuario.findById = () => ({
    select: async () => ({ _id: "user-1", rol: "productor", estado: "suspendido" }),
  });

  const req = {
    cookies: { auth_token: "token" },
    headers: {},
    originalUrl: "/api/precios",
  };
  const res = crearRes();
  let nextCalled = false;

  await authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.payload.message, /suspendida/i);

  jwt.verify = originalVerify;
  Usuario.findById = originalFindById;
});

test('authMiddleware permite comprador pendiente en rutas de comprador', async () => {
  const originalVerify = jwt.verify;
  const originalFindById = Usuario.findById;

  jwt.verify = () => ({ id: "user-2" });
  Usuario.findById = () => ({
    select: async () => ({ _id: "user-2", rol: "comprador", estado: "pendiente" }),
  });

  const req = {
    cookies: { auth_token: "token" },
    headers: {},
    originalUrl: "/api/comprador/usuario/user-2",
  };
  const res = crearRes();
  let nextCalled = false;

  await authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, { id: "user-2", rol: "comprador", estado: "pendiente" });

  jwt.verify = originalVerify;
  Usuario.findById = originalFindById;
});

test("authMiddleware acepta token Bearer y bloquea estado rechazado", async () => {
  const originalVerify = jwt.verify;
  const originalFindById = Usuario.findById;

  jwt.verify = () => ({ id: "user-3" });
  Usuario.findById = () => ({
    select: async () => ({ _id: "user-3", rol: "comprador", estado: "rechazado" }),
  });

  const req = {
    cookies: {},
    headers: { authorization: "Bearer token-remoto" },
    originalUrl: "/api/comprador/dashboard",
  };
  const res = crearRes();
  let nextCalled = false;

  await authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.payload.message, /no tiene acceso/i);

  jwt.verify = originalVerify;
  Usuario.findById = originalFindById;
});

test("authMiddleware permite consultar /api/auth/me para cuenta eliminada", async () => {
  const originalVerify = jwt.verify;
  const originalFindById = Usuario.findById;

  jwt.verify = () => ({ id: "user-4" });
  Usuario.findById = () => ({
    select: async () => ({ _id: "user-4", rol: "productor", estado: "eliminado" }),
  });

  const req = {
    cookies: { auth_token: "token" },
    headers: {},
    originalUrl: "/api/auth/me",
  };
  const res = crearRes();
  let nextCalled = false;

  await authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, { id: "user-4", rol: "productor", estado: "eliminado" });

  jwt.verify = originalVerify;
  Usuario.findById = originalFindById;
});
