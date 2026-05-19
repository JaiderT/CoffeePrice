import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import Usuario from "../models/usuario.js";
import {
  __setEnviarCodigoVerificacionForTests,
  googleCallback,
  login,
  resendVerification,
  verifyEmailCodigo,
} from "../controllers/AuthController.js";

function crearRes() {
  return {
    statusCode: 200,
    payload: null,
    cookies: [],
    redirectedTo: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
    cookie(name, value, options) {
      this.cookies.push({ name, value, options });
      return this;
    },
    redirect(url) {
      this.redirectedTo = url;
      return this;
    },
  };
}

test("login bloquea cuenta suspendida antes de autenticar", async () => {
  const originalFindOne = Usuario.findOne;
  const originalFindByIdAndUpdate = Usuario.findByIdAndUpdate;

  Usuario.findOne = async () => ({
    _id: "user-suspendido",
    nombre: "Ana",
    apellido: "Lopez",
    email: "ana@mail.com",
    rol: "productor",
    estado: "suspendido",
    password: await bcrypt.hash("Password123", 10),
  });
  Usuario.findByIdAndUpdate = async () => null;

  const req = {
    body: {
      email: "ANA@MAIL.COM",
      password: "Password123",
    },
  };
  const res = crearRes();

  await login(req, res);

  assert.equal(res.statusCode, 403);
  assert.match(res.payload.message, /suspendida/i);
  assert.equal(res.cookies.length, 0);

  Usuario.findOne = originalFindOne;
  Usuario.findByIdAndUpdate = originalFindByIdAndUpdate;
});

test("login exitoso fija cookie y devuelve sesion del usuario", async () => {
  const originalFindOne = Usuario.findOne;
  const originalFindByIdAndUpdate = Usuario.findByIdAndUpdate;

  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

  const passwordHash = await bcrypt.hash("Password123", 10);
  const usuario = {
    _id: "user-activo",
    nombre: "Luis",
    apellido: "Diaz",
    email: "luis@mail.com",
    rol: "productor",
    celular: "3001234567",
    estado: "activo",
    password: passwordHash,
  };

  let emailConsultado = null;
  let ultimaConexionActualizada = false;

  Usuario.findOne = async (query) => {
    emailConsultado = query.email;
    return usuario;
  };
  Usuario.findByIdAndUpdate = async (id, update) => {
    ultimaConexionActualizada = id === "user-activo" && update.ultimaConexion instanceof Date;
    return null;
  };

  const req = {
    body: {
      email: "  LUIS@MAIL.COM  ",
      password: "Password123",
    },
  };
  const res = crearRes();

  await login(req, res);

  assert.equal(emailConsultado, "luis@mail.com");
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.user.email, "luis@mail.com");
  assert.equal(res.payload.user.estado, "activo");
  assert.equal(res.cookies.length, 1);
  assert.equal(res.cookies[0].name, "auth_token");
  assert.equal(res.cookies[0].options.httpOnly, true);
  assert.equal(ultimaConexionActualizada, true);

  Usuario.findOne = originalFindOne;
  Usuario.findByIdAndUpdate = originalFindByIdAndUpdate;
});

test("verifyEmailCodigo rechaza codigo incorrecto aunque exista hash", async () => {
  const originalFindOne = Usuario.findOne;

  Usuario.findOne = async () => ({
    _id: "user-verif-1",
    nombre: "Paula",
    apellido: "Rojas",
    email: "paula@mail.com",
    rol: "productor",
    estado: "pendiente",
    codigoVerificacion: await bcrypt.hash("123456", 10),
    codigoVerificacionExpira: new Date(Date.now() + 60_000),
    save: async () => {},
  });

  const req = {
    body: {
      email: "paula@mail.com",
      code: "654321",
    },
  };
  const res = crearRes();

  await verifyEmailCodigo(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, "Codigo incorrecto");
  assert.equal(res.cookies.length, 0);

  Usuario.findOne = originalFindOne;
});

test("verifyEmailCodigo acepta codigo hasheado para comprador y limpia datos pendientes", async () => {
  const originalFindOne = Usuario.findOne;

  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

  const usuario = {
    _id: "user-verif-2",
    nombre: "Marta",
    apellido: "Suarez",
    email: "marta@mail.com",
    rol: "comprador",
    celular: "3105550000",
    estado: "pendiente",
    codigoVerificacion: await bcrypt.hash("123456", 10),
    codigoVerificacionExpira: new Date(Date.now() + 60_000),
    ultimaConexion: null,
    saveCalled: false,
    async save() {
      this.saveCalled = true;
    },
  };

  Usuario.findOne = async () => usuario;

  const req = {
    body: {
      email: "MARTA@MAIL.COM",
      code: "123456",
    },
  };
  const res = crearRes();

  await verifyEmailCodigo(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.pendiente, true);
  assert.equal(res.payload.user.estado, "pendiente");
  assert.equal(usuario.codigoVerificacion, null);
  assert.equal(usuario.codigoVerificacionExpira, null);
  assert.equal(usuario.saveCalled, true);
  assert.ok(usuario.ultimaConexion instanceof Date);
  assert.equal(res.cookies.length, 1);
  assert.equal(res.cookies[0].name, "auth_token");

  Usuario.findOne = originalFindOne;
});

test("resendVerification aplica cooldown cuando el codigo sigue vigente", async () => {
  const originalFindOne = Usuario.findOne;

  Usuario.findOne = async () => ({
    _id: "user-resend-1",
    nombre: "Carlos",
    email: "carlos@mail.com",
    estado: "pendiente",
    codigoVerificacionExpira: new Date(Date.now() + 9 * 60 * 1000 + 10_000),
    save: async () => {},
  });

  const req = {
    body: {
      email: "CARLOS@MAIL.COM",
    },
  };
  const res = crearRes();

  await resendVerification(req, res);

  assert.equal(res.statusCode, 429);
  assert.match(res.payload.message, /espera un momento/i);

  Usuario.findOne = originalFindOne;
});

test("resendVerification rehace hash y fecha cuando ya se puede reenviar", async () => {
  const originalFindOne = Usuario.findOne;
  const correos = [];

  const usuario = {
    _id: "user-resend-2",
    nombre: "Claudia",
    email: "claudia@mail.com",
    estado: "pendiente",
    codigoVerificacion: await bcrypt.hash("111111", 10),
    codigoVerificacionExpira: new Date(Date.now() - 60_000),
    saveCalled: false,
    async save() {
      this.saveCalled = true;
    },
  };

  Usuario.findOne = async () => usuario;
  __setEnviarCodigoVerificacionForTests(async (email, nombre, codigo) => {
    correos.push({ email, nombre, codigo });
  });

  const req = {
    body: {
      email: "  CLAUDIA@MAIL.COM ",
    },
  };
  const res = crearRes();

  await resendVerification(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.message, "Codigo reenviado exitosamente");
  assert.equal(usuario.saveCalled, true);
  assert.ok(usuario.codigoVerificacion);
  assert.notEqual(usuario.codigoVerificacionExpira, null);
  assert.ok(usuario.codigoVerificacionExpira instanceof Date);
  assert.equal(correos.length, 1);
  assert.equal(correos[0].email, "claudia@mail.com");
  assert.equal(correos[0].nombre, "Claudia");
  assert.match(correos[0].codigo, /^\d{6}$/);

  Usuario.findOne = originalFindOne;
  __setEnviarCodigoVerificacionForTests(null);
});

test("googleCallback redirige a completar perfil para comprador pendiente y fija cookie", () => {
  const originalFrontendUrl = process.env.FRONTEND_URL;
  const originalJwtSecret = process.env.JWT_SECRET;

  process.env.FRONTEND_URL = "https://coffeprice.app";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

  const req = {
    user: {
      _id: "google-1",
      nombre: "Diana",
      apellido: "Ruiz",
      email: "diana@mail.com",
      rol: "comprador",
      estado: "pendiente",
    },
  };
  const res = crearRes();

  googleCallback(req, res);

  assert.equal(res.cookies.length, 1);
  assert.equal(res.cookies[0].name, "auth_token");
  assert.equal(res.redirectedTo, "https://coffeprice.app/completar-perfil");

  process.env.FRONTEND_URL = originalFrontendUrl;
  process.env.JWT_SECRET = originalJwtSecret;
});

test("googleCallback bloquea cuenta suspendida con redireccion de error", () => {
  const originalFrontendUrl = process.env.FRONTEND_URL;
  process.env.FRONTEND_URL = "https://coffeprice.app";

  const req = {
    user: {
      _id: "google-2",
      rol: "productor",
      estado: "suspendido",
    },
  };
  const res = crearRes();

  googleCallback(req, res);

  assert.equal(res.cookies.length, 0);
  assert.equal(res.redirectedTo, "https://coffeprice.app/login?error=cuenta_suspendida");

  process.env.FRONTEND_URL = originalFrontendUrl;
});
