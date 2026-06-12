import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import Usuario from "../models/usuario.js";
import {
  __setEnviarCorreoRecuperacionForTests,
  cambiarPassword,
  solicitarCodigo,
} from "../controllers/recuperar.js";

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

test("solicitarCodigo normaliza correo y envia codigo a usuario con password", async () => {
  const originalFindOne = Usuario.findOne;
  const correos = [];
  let emailConsultado = null;

  const usuario = {
    _id: "user-recovery-1",
    nombre: "Lina",
    email: "lina@mail.com",
    password: await bcrypt.hash("Password123", 10),
    codigoRecuperacion: null,
    codigoExpiracion: null,
    saveCalled: false,
    async save() {
      this.saveCalled = true;
    },
  };

  Usuario.findOne = async (query) => {
    emailConsultado = query.email;
    return usuario;
  };
  __setEnviarCorreoRecuperacionForTests(async (mailOptions) => {
    correos.push(mailOptions);
  });

  const req = { body: { email: "  LINA@MAIL.COM " } };
  const res = crearRes();

  await solicitarCodigo(req, res);

  assert.equal(emailConsultado, "lina@mail.com");
  assert.equal(res.statusCode, 200);
  assert.match(res.payload.message, /recibirás un código/i);
  assert.equal(usuario.saveCalled, true);
  assert.ok(usuario.codigoRecuperacion);
  assert.ok(usuario.codigoExpiracion instanceof Date);
  assert.equal(correos.length, 1);
  assert.equal(correos[0].to, "lina@mail.com");
  assert.match(correos[0].html, /\d{6}/);

  Usuario.findOne = originalFindOne;
  __setEnviarCorreoRecuperacionForTests(null);
});

test("solicitarCodigo no revela si el correo no existe", async () => {
  const originalFindOne = Usuario.findOne;
  let envioIntentado = false;

  Usuario.findOne = async () => null;
  __setEnviarCorreoRecuperacionForTests(async () => {
    envioIntentado = true;
  });

  const req = { body: { email: "nadie@mail.com" } };
  const res = crearRes();

  await solicitarCodigo(req, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.payload.message, /recibirás un código/i);
  assert.equal(envioIntentado, false);

  Usuario.findOne = originalFindOne;
  __setEnviarCorreoRecuperacionForTests(null);
});

test("cambiarPassword rechaza claves que no cumplen politica", async () => {
  const req = {
    body: {
      email: "lina@mail.com",
      codigo: "123456",
      nuevaPassword: "seis12",
    },
  };
  const res = crearRes();

  await cambiarPassword(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.payload.message, /mínimo 10 caracteres/i);
});

test("cambiarPassword valida codigo, actualiza hash y limpia recuperacion", async () => {
  const originalFindOne = Usuario.findOne;
  const correos = [];

  const usuario = {
    _id: "user-recovery-2",
    nombre: "Marco",
    email: "marco@mail.com",
    password: await bcrypt.hash("OldPassword123", 10),
    codigoRecuperacion: await bcrypt.hash("654321", 10),
    codigoExpiracion: new Date(Date.now() + 60_000),
    saveCalled: false,
    async save() {
      this.saveCalled = true;
    },
  };

  Usuario.findOne = async (query) => {
    assert.equal(query.email, "marco@mail.com");
    return usuario;
  };
  __setEnviarCorreoRecuperacionForTests(async (mailOptions) => {
    correos.push(mailOptions);
  });

  const req = {
    body: {
      email: " MARCO@MAIL.COM ",
      codigo: "654321",
      nuevaPassword: "NewPassword123",
    },
  };
  const res = crearRes();

  await cambiarPassword(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.message, "Contraseña actualizada exitosamente");
  assert.equal(usuario.codigoRecuperacion, null);
  assert.equal(usuario.codigoExpiracion, null);
  assert.equal(usuario.saveCalled, true);
  assert.equal(await bcrypt.compare("NewPassword123", usuario.password), true);
  assert.equal(correos.length, 1);
  assert.equal(correos[0].to, "marco@mail.com");

  Usuario.findOne = originalFindOne;
  __setEnviarCorreoRecuperacionForTests(null);
});
