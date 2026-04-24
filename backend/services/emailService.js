import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const enviarAlertaPrecio = async ({ destinatario, nombreUsuario, nombreComprador, precioMinimo, precioActual }) => {
  try {
    await transporter.sendMail({
      from: `"CoffePrice ☕" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: `🔔 ¡Alerta de precio! ${nombreComprador} superó $${Number(precioActual).toLocaleString('es-CO')}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#F5ECD7;font-family:Arial,sans-serif;">
          <div style="max-width:560px;margin:30px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <div style="background:#2C1A0E;padding:28px 32px;text-align:center;">
              <div style="font-size:32px;margin-bottom:8px;">☕</div>
              <h1 style="color:#C8A96E;margin:0;font-size:22px;font-weight:bold;">CoffePrice</h1>
              <p style="color:#D8C7A8;margin:6px 0 0;font-size:13px;">El Pital, Huila · Colombia</p>
            </div>
            <div style="padding:32px;">
              <div style="background:#FFF8E7;border:1px solid #C8A96E;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
                <div style="font-size:28px;margin-bottom:8px;">🔔</div>
                <h2 style="color:#2C1A0E;margin:0 0 6px;font-size:18px;">¡Tu alerta de precio se cumplió!</h2>
                <p style="color:#8B7355;margin:0;font-size:13px;">Hola <strong>${nombreUsuario}</strong>, el precio que esperabas ya está disponible</p>
              </div>
              <div style="background:#F5ECD7;border-radius:12px;padding:20px;margin-bottom:24px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:8px 0;font-size:13px;color:#8B7355;">Comprador</td>
                    <td style="padding:8px 0;font-size:13px;font-weight:bold;color:#2C1A0E;text-align:right;">${nombreComprador}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:13px;color:#8B7355;border-top:1px solid #E0D0B0;">Tu precio mínimo</td>
                    <td style="padding:8px 0;font-size:13px;font-weight:bold;color:#2C1A0E;text-align:right;border-top:1px solid #E0D0B0;">$${Number(precioMinimo).toLocaleString('es-CO')}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:13px;color:#8B7355;border-top:1px solid #E0D0B0;">Precio actual</td>
                    <td style="padding:8px 0;font-size:16px;font-weight:bold;color:#C8A96E;text-align:right;border-top:1px solid #E0D0B0;">$${Number(precioActual).toLocaleString('es-CO')}</td>
                  </tr>
                </table>
              </div>
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${process.env.FRONTEND_URL}"
                  style="background:#C8A96E;color:white;padding:14px 32px;border-radius:25px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">
                  Ver precios ahora →
                </a>
              </div>
              <p style="color:#8B7355;font-size:11px;text-align:center;margin:0;">
                Esta alerta se enviará una sola vez. Puedes gestionar tus alertas desde la app.<br>
                CoffePrice · El Pital, Huila · Colombia
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`✅ Correo de alerta enviado a ${destinatario}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar correo:', error.message);
    return false;
  }
};

export const enviarAlertaNoticia = async ({ destinatario, nombreUsuario, tituloNoticia, categoria, resumen }) => {
  const categoriaEmoji = {
    mercado: '📈', internacional: '🌎', clima: '🌧️',
    fnc: '🏛️', produccion: '🌱', consejos: '💡', el_pital: '⛰️'
  };
  try {
    await transporter.sendMail({
      from: `"CoffePrice ☕" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: `📰 Nueva noticia: ${tituloNoticia}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#F5ECD7;font-family:Arial,sans-serif;">
          <div style="max-width:560px;margin:30px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <div style="background:#2C1A0E;padding:28px 32px;text-align:center;">
              <div style="font-size:32px;margin-bottom:8px;">☕</div>
              <h1 style="color:#C8A96E;margin:0;font-size:22px;font-weight:bold;">CoffePrice</h1>
              <p style="color:#D8C7A8;margin:6px 0 0;font-size:13px;">El Pital, Huila · Colombia</p>
            </div>
            <div style="padding:32px;">
              <div style="background:#FFF8E7;border:1px solid #C8A96E;border-radius:12px;padding:20px;margin-bottom:24px;">
                <div style="font-size:24px;margin-bottom:8px;">${categoriaEmoji[categoria] || '📰'}</div>
                <p style="color:#8B7355;margin:0 0 4px;font-size:12px;text-transform:uppercase;font-weight:bold;">${categoria}</p>
                <h2 style="color:#2C1A0E;margin:0 0 10px;font-size:17px;line-height:1.4;">${tituloNoticia}</h2>
                <p style="color:#6B5A4D;margin:0;font-size:13px;line-height:1.6;">${resumen}</p>
              </div>
              <p style="color:#8B7355;font-size:12px;margin-bottom:16px;">Hola <strong>${nombreUsuario}</strong>, hay una nueva noticia en la categoría que sigues.</p>
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${process.env.FRONTEND_URL}/noticias"
                  style="background:#C8A96E;color:white;padding:14px 32px;border-radius:25px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">
                  Ver noticia completa →
                </a>
              </div>
              <p style="color:#8B7355;font-size:11px;text-align:center;margin:0;">
                Puedes gestionar tus alertas de noticias desde la app.<br>
                CoffePrice · El Pital, Huila · Colombia
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`✅ Correo de noticia enviado a ${destinatario}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar correo noticia:', error.message);
    return false;
  }
};

export const enviarNotificacionPrecio = async ({ destinatario, nombreUsuario, nombreComprador, preciocarga, preciokg, tipocafe, accion }) => {
  const tipoLabel = {
    pergamino_seco: 'Pergamino seco',
    especial: 'Especial / Fino',
    organico: 'Orgánico',
    verde: 'Café verde',
  };
  try {
    await transporter.sendMail({
      from: `"CoffePrice ☕" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: `☕ ${nombreComprador} ${accion === 'nuevo' ? 'publicó' : 'actualizó'} su precio de café`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#F5ECD7;font-family:Arial,sans-serif;">
          <div style="max-width:560px;margin:30px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <div style="background:#2C1A0E;padding:28px 32px;text-align:center;">
              <div style="font-size:32px;margin-bottom:8px;">☕</div>
              <h1 style="color:#C8A96E;margin:0;font-size:22px;font-weight:bold;">CoffePrice</h1>
              <p style="color:#D8C7A8;margin:6px 0 0;font-size:13px;">El Pital, Huila · Colombia</p>
            </div>
            <div style="padding:32px;">
              <div style="background:#FFF8E7;border:1px solid #C8A96E;border-radius:12px;padding:20px;margin-bottom:24px;">
                <div style="font-size:24px;margin-bottom:8px;">📢</div>
                <h2 style="color:#2C1A0E;margin:0 0 6px;font-size:17px;">
                  ${nombreComprador} ${accion === 'nuevo' ? 'publicó un nuevo precio' : 'actualizó su precio'}
                </h2>
                <p style="color:#8B7355;margin:0;font-size:13px;">Hola <strong>${nombreUsuario}</strong>, hay novedades en el mercado del café</p>
              </div>
              <div style="background:#F5ECD7;border-radius:12px;padding:20px;margin-bottom:24px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:8px 0;font-size:13px;color:#8B7355;">Comprador</td>
                    <td style="padding:8px 0;font-size:13px;font-weight:bold;color:#2C1A0E;text-align:right;">${nombreComprador}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:13px;color:#8B7355;border-top:1px solid #E0D0B0;">Tipo de café</td>
                    <td style="padding:8px 0;font-size:13px;font-weight:bold;color:#2C1A0E;text-align:right;border-top:1px solid #E0D0B0;">${tipoLabel[tipocafe] || tipocafe}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:13px;color:#8B7355;border-top:1px solid #E0D0B0;">Precio por carga</td>
                    <td style="padding:8px 0;font-size:16px;font-weight:bold;color:#C8A96E;text-align:right;border-top:1px solid #E0D0B0;">$${Number(preciocarga).toLocaleString('es-CO')}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:13px;color:#8B7355;border-top:1px solid #E0D0B0;">Precio por kg</td>
                    <td style="padding:8px 0;font-size:13px;font-weight:bold;color:#2C1A0E;text-align:right;border-top:1px solid #E0D0B0;">$${Number(preciokg).toLocaleString('es-CO')}</td>
                  </tr>
                </table>
              </div>
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${process.env.FRONTEND_URL}/precios"
                  style="background:#C8A96E;color:white;padding:14px 32px;border-radius:25px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">
                  Ver precios ahora →
                </a>
              </div>
              <p style="color:#8B7355;font-size:11px;text-align:center;margin:0;">
                CoffePrice · El Pital, Huila · Colombia
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`✅ Notificación de precio enviada a ${destinatario}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar notificación de precio:', error.message);
    return false;
  }
};
