import "dotenv/config"; // ← primera línea
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
import ventaRoutes from "./routes/venta.js";
import compradorRoutes from "./routes/comprador.js";
import RecuperarPassword from "./routes/recuperar.js";
import Clima from './routes/clima.js'

const app = express();

app.use(cors());
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
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
app.use("/api/ventas", ventaRoutes);
app.use("/api/comprador", compradorRoutes);
app.use("/api/recuperar", RecuperarPassword);
app.use('/api/clima', Clima)

app.listen(8081, () => console.log('Servidor corriendo en http://localhost:8081'));
