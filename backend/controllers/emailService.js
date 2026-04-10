// services/emailService.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function enviarCorreoVerificacion(nombre, email, token) {
  const link = `${process.env.BACKEND_URL}/api/auth/verificar-email?token=${token}`;

  await transporter.sendMail({
    from: `"CoffePrice" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Activa tu cuenta en CoffePrice ☕",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: auto; border: 1px solid #d4b896; border-radius: 12px; overflow: hidden;">
        <div style="background: #3d1f0d; padding: 28px 32px; text-align: center;">
          <h1 style="color: #f5dfc0; margin: 0; font-size: 22px;">☕ CoffePrice</h1>
        </div>
        <div style="padding: 36px 32px; background: #fffdf8;">
          <h2 style="color: #2C1A0E; font-size: 20px; margin: 0 0 12px;">¡Hola, ${nombre}!</h2>
          <p style="color: #7a5c3e; font-size: 14px; line-height: 1.7; margin: 0 0 28px;">
            Gracias por registrarte en CoffePrice. Haz clic en el botón para activar tu cuenta y empezar a consultar los precios del café en tu zona.
          </p>
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${link}" style="background: #3d1f0d; color: #f5dfc0; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 600; display: inline-block;">
              Activar mi cuenta
            </a>
          </div>
          <p style="color: #a0784e; font-size: 12px; text-align: center; margin: 0;">
            Este link expira en <strong>24 horas</strong>. Si no creaste esta cuenta, ignora este correo.
          </p>
        </div>
        <div style="background: #f0e8d5; padding: 16px 32px; text-align: center;">
          <p style="color: #a0784e; font-size: 11px; margin: 0;">© CoffePrice · Pital, Huila, Colombia</p>
        </div>
      </div>
    `,
  });
}

export async function enviarCorreoBienvenida(nombre, email) {
  await transporter.sendMail({
    from: `"CoffePrice" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "¡Tu cuenta está activa! ☕ Bienvenido a CoffePrice",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: auto; border: 1px solid #d4b896; border-radius: 12px; overflow: hidden;">
        <div style="background: #3d1f0d; padding: 28px 32px; text-align: center;">
          <h1 style="color: #f5dfc0; margin: 0; font-size: 22px;">☕ CoffePrice</h1>
        </div>
        <div style="padding: 36px 32px; background: #fffdf8; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
          <h2 style="color: #2C1A0E; font-size: 20px; margin: 0 0 12px;">¡Bienvenido, ${nombre}!</h2>
          <p style="color: #7a5c3e; font-size: 14px; line-height: 1.7; margin: 0 0 28px;">
            Tu cuenta en CoffePrice está activa. Ya puedes consultar los precios del café en tu zona, configurar alertas y mucho más.
          </p>
          <a href="${process.env.FRONTEND_URL}/login" style="background: #3d1f0d; color: #f5dfc0; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 600; display: inline-block;">
            Iniciar sesión
          </a>
        </div>
        <div style="background: #f0e8d5; padding: 16px 32px; text-align: center;">
          <p style="color: #a0784e; font-size: 11px; margin: 0;">© CoffePrice · Pital, Huila, Colombia</p>
        </div>
      </div>
    `,
  });
}