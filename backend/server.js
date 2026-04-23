import "dotenv/config";
import './config/env.js'
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport.js';
import "./db/db.js";

// Rutas
import authRoutes from "./routes/authRoutes.js";
import alertaRoutes from "./routes/alerta.js";
import noticiaRoutes from "./routes/noticiaRoutes.js";
import precioRoutes from "./routes/precio.js";
import prediccionRoutes from "./routes/prediccionRoutes.js";
import resenaRoutes from "./routes/reseña.js";
import solicitudRoutes from "./routes/solicitudRoutes.js";
import usuarioRoutes from "./routes/usuario.js";
import compradorRoutes from "./routes/comprador.js";
import RecuperarPassword from "./routes/recuperar.js";
import Clima from './routes/clima.js'
import resenaPlataformaRoutes from "./routes/resenaPlataforma.js";
import { publicLimiter } from "./middlewares/rateLimit.js";
import { iniciarCronNoticias } from './jobs/noticiaCron.js';
import { iniciarCronPrecioFNC } from './jobs/precioCron.js';
import Contacto from "./routes/contacto.js";
import historialPrecioRoutes from "./routes/historialPrecio.js";
import chatbotRoutes from './routes/chatbot.js';
import alertaNoticia from './routes/alertaNoticia.js';
import configuracionRoutes from "./routes/configuracion.js";
import precioFNCRoutes from "./routes/precioFNC.js";

const app = express();

app.disable('x-powered-by');

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https:;"
  );
  next();
});

app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

app.use(passport.initialize());

process.on('unhandledRejection', (reason) => {
    console.error('[UnhandledRejection]', reason);
});

app.use('/api/precios', publicLimiter);
app.use('/api/predicciones', publicLimiter);
app.use('/api/noticias', publicLimiter);
app.use('/api/comprador', publicLimiter);
app.use('/api/resenas', publicLimiter);
app.use('/api/clima', publicLimiter);
app.use('/api/precio-fnc', publicLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/alertas", alertaRoutes);
app.use("/api/noticias", noticiaRoutes);
app.use("/api/precios", precioRoutes);
app.use("/api/predicciones", prediccionRoutes);
app.use("/api/resenas", resenaRoutes);
app.use("/api/solicitudes", solicitudRoutes);
app.use("/api/usuario", usuarioRoutes);
app.use("/api/comprador", compradorRoutes);
app.use("/api/recuperar", RecuperarPassword);
app.use('/api/clima', Clima);
app.use("/api/resenas-plataforma", resenaPlataformaRoutes);
app.use("/api", Contacto);
app.use("/api/historial-precios", historialPrecioRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/alertas-noticias', alertaNoticia);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/precio-fnc', precioFNCRoutes);

app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);
    const statusCode = err.statusCode || err.status || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err.message;
    res.status(statusCode).json({ message });
});

app.listen(8081, async () => {
  console.log("Servidor corriendo en http://localhost:8081");
  if (process.env.NODE_ENV !== "test") {
    await iniciarCronNoticias();
    console.log("Noticias automaticas: activas");
    iniciarCronPrecioFNC();
  }
});