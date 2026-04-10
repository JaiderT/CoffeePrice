
import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/contacto", async (req, res) => {
  const { nombre, correo, asunto, mensaje } = req.body;

  if (!nombre || !correo || !mensaje) {
    return res.status(400).json({ error: "Faltan campos requeridos." });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"CoffePrice Contacto" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    replyTo: correo,
    subject: asunto ? `[CoffePrice] ${asunto}` : `[CoffePrice] Nuevo mensaje de ${nombre}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #d4b896; border-radius: 12px; overflow: hidden;">
        <div style="background: #3d1f0d; padding: 24px 32px;">
          <h2 style="color: #f5dfc0; margin: 0; font-size: 20px;">☕ Nuevo mensaje </h2>
        </div>
        <div style="padding: 32px; background: #fffdf8;">
          <table style="width: 100%; font-size: 14px; color: #2C1A0E; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #a0784e; font-weight: 600; width: 120px;">Nombre</td>
              <td style="padding: 8px 0;">${nombre}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a0784e; font-weight: 600;">Correo</td>
              <td style="padding: 8px 0;"><a href="mailto:${correo}" style="color: #6b3c1e;">${correo}</a></td>
            </tr>
            ${asunto ? `
            <tr>
              <td style="padding: 8px 0; color: #a0784e; font-weight: 600;">Asunto</td>
              <td style="padding: 8px 0;">${asunto}</td>
            </tr>` : ""}
          </table>
          <hr style="border: none; border-top: 1px solid #d4b896; margin: 20px 0;" />
          <p style="color: #a0784e; font-size: 12px; font-weight: 600; margin: 0 0 8px;">MENSAJE</p>
          <p style="color: #2C1A0E; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-line;">${mensaje}</p>
        </div>
        <div style="background: #f0e8d5; padding: 16px 32px; text-align: center;">
          <p style="color: #a0784e; font-size: 12px; margin: 0;">Puedes responder directamente a este correo — llegará a ${correo}</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Correo enviado correctamente." });
  } catch (error) {
    console.error("Error al enviar correo:", error);
    res.status(500).json({ error: "No se pudo enviar el correo. Intenta más tarde." });
  }
});

export default router;