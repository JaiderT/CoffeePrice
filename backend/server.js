import "dotenv/config";
import './config/env.js'
import express from 'express';
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
import Contacto from "./routes/contacto.js";
import historialPrecioRoutes from "./routes/historialPrecio.js";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());

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

// rutas

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

app.listen(8081, () => console.log('Servidor corriendo en http://localhost:8081'));
