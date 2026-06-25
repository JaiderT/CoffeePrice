import test from "node:test";
import assert from "node:assert/strict";
import {
  escapeHtml,
  validarContactoPayload,
  construirMailOptions,
} from "../routes/contacto.js";

test("validarContactoPayload rechaza correo invalido", () => {
  const resultado = validarContactoPayload({
    nombre: "Cafe Centro",
    correo: "correo-invalido",
    asunto: "Consulta",
    mensaje: "Hola",
  });

  assert.equal(resultado.ok, false);
  assert.equal(resultado.error, "Correo inválido.");
});

test("validarContactoPayload rechaza mensaje demasiado largo", () => {
  const resultado = validarContactoPayload({
    nombre: "Cafe Centro",
    correo: "compras@cafecentro.com",
    asunto: "Consulta",
    mensaje: "a".repeat(4001),
  });

  assert.equal(resultado.ok, false);
  assert.equal(resultado.error, "Uno de los campos supera el tamano permitido.");
});

test("escapeHtml neutraliza etiquetas HTML peligrosas", () => {
  const escapado = escapeHtml(`<script>alert("x")</script>`);
  assert.equal(escapado, "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
});

test("construirMailOptions sanea asunto y mensaje antes del HTML final", () => {
  process.env.EMAIL_USER = "support@coffeprice.test";

  const payload = validarContactoPayload({
    nombre: "Comprador Demo",
    correo: "CLIENTE@MAIL.COM",
    asunto: "Necesito ayuda\r\nBCC:evil@mail.com",
    mensaje: `<b>Mensaje</b> con "comillas"`,
  });

  assert.equal(payload.ok, true);

  const mail = construirMailOptions(payload.data);

  assert.equal(mail.replyTo, "cliente@mail.com");
  assert.match(mail.subject, /\[support\.coffeprice@gmail\.com\] Necesito ayuda BCC:evil@mail\.com/);
  assert.match(mail.html, /&lt;b&gt;Mensaje&lt;\/b&gt; con &quot;comillas&quot;/);
  assert.doesNotMatch(mail.html, /<script>|<b>Mensaje<\/b>/);
});
