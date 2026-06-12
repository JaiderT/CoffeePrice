import express from "express";
import nodemailer from "nodemailer";
import { contactLimiter } from "../middlewares/rateLimit.js";

const router = express.Router();
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function normalizarContactoPayload(payload = {}) {
  const { nombre, correo, asunto, mensaje } = payload;

  const nombreSeguro = String(nombre || "").trim();
  const correoSeguro = String(correo || "").trim().toLowerCase();
  const asuntoSeguro = String(asunto || "").trim().replace(/[\r\n]+/g, " ");
  const mensajeSeguro = String(mensaje || "").trim();

  return {
    nombreSeguro,
    correoSeguro,
    asuntoSeguro,
    mensajeSeguro,
  };
}

export function validarContactoPayload(payload = {}) {
  const {
    nombreSeguro,
    correoSeguro,
    asuntoSeguro,
    mensajeSeguro,
  } = normalizarContactoPayload(payload);

  if (!nombreSeguro || !correoSeguro || !mensajeSeguro) {
    return { ok: false, error: "Faltan campos requeridos." };
  }

  if (!EMAIL_REGEX.test(correoSeguro)) {
    return { ok: false, error: "Correo inválido." };
  }

  if (nombreSeguro.length > 120 || asuntoSeguro.length > 180 || mensajeSeguro.length > 4000) {
    return { ok: false, error: "Uno de los campos supera el tamano permitido." };
  }

  return {
    ok: true,
    data: {
      nombreSeguro,
      correoSeguro,
      asuntoSeguro,
      mensajeSeguro,
    },
  };
}

export function construirMailOptions({ nombreSeguro, correoSeguro, asuntoSeguro, mensajeSeguro }) {
  return {
    from: `"support.coffeprice@gmail.com" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    replyTo: correoSeguro,
    subject: asuntoSeguro ? `[support.coffeprice@gmail.com] ${asuntoSeguro}` : `[CoffePrice] Nuevo mensaje de ${nombreSeguro}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #d4b896; border-radius: 12px; overflow: hidden;">
        <div style="background: #3d1f0d; padding: 24px 32px;">
          <h2 style="color: #f5dfc0; margin: 0; font-size: 20px;">Nuevo mensaje</h2>
        </div>
        <div style="padding: 32px; background: #fffdf8;">
          <table style="width: 100%; font-size: 14px; color: #2C1A0E; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #a0784e; font-weight: 600; width: 120px;">Nombre</td>
              <td style="padding: 8px 0;">${escapeHtml(nombreSeguro)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a0784e; font-weight: 600;">Correo</td>
              <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(correoSeguro)}" style="color: #6b3c1e;">${escapeHtml(correoSeguro)}</a></td>
            </tr>
            ${asuntoSeguro ? `
            <tr>
              <td style="padding: 8px 0; color: #a0784e; font-weight: 600;">Asunto</td>
              <td style="padding: 8px 0;">${escapeHtml(asuntoSeguro)}</td>
            </tr>` : ""}
          </table>
          <hr style="border: none; border-top: 1px solid #d4b896; margin: 20px 0;" />
          <p style="color: #a0784e; font-size: 12px; font-weight: 600; margin: 0 0 8px;">MENSAJE</p>
          <p style="color: #2C1A0E; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-line;">${escapeHtml(mensajeSeguro)}</p>
        </div>
        <div style="background: #f0e8d5; padding: 16px 32px; text-align: center;">
          <p style="color: #a0784e; font-size: 12px; margin: 0;">Puedes responder directamente a este correo y llegara a ${escapeHtml(correoSeguro)}</p>
        </div>
      </div>
    `,
  };
}

router.post("/contacto", contactLimiter, async (req, res) => {
  const validacion = validarContactoPayload(req.body);
  if (!validacion.ok) {
    return res.status(400).json({ error: validacion.error });
  }

  const { nombreSeguro, correoSeguro, asuntoSeguro, mensajeSeguro } = validacion.data;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = construirMailOptions({
    nombreSeguro,
    correoSeguro,
    asuntoSeguro,
    mensajeSeguro,
  });

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Correo enviado correctamente." });
  } catch (error) {
    console.error("Error al enviar correo:", error);
    res.status(500).json({ error: "No se pudo enviar el correo. Intenta más tarde." });
  }
});

export default router;
