import express from 'express';
import cors from 'cors';
import "dotenv/config";
import "./db/db.js";

// Rutas
import alertaRoutes from "./routes/alerta.js";
import loginRoutes from "./routes/login.js";
import registerRoutes from "./routes/register.js";
import noticiaRoutes from "./routes/noticiaRoutes.js";
import precioRoutes from "./routes/precio.js";
import prediccionRoutes from "./routes/prediccionRoutes.js";
import resenaRoutes from "./routes/reseña.js";
import solicitudRoutes from "./routes/solicitudRoutes.js";
import usuarioRoutes from "./routes/usuario.js";
import ventaRoutes from "./routes/venta.js";
import compradorRoutes from "./routes/comprador.js";

const app = express();

app.use(cors());
app.use(express.json());

// Rutas públicas
app.use("/api/login", loginRoutes);
app.use("/api/register", registerRoutes);

// Rutas
app.use("/api/alertas", alertaRoutes);
app.use("/api/noticias", noticiaRoutes);
app.use("/api/precios", precioRoutes);
app.use("/api/predicciones", prediccionRoutes);
app.use("/api/resenas", resenaRoutes);
app.use("/api/solicitudes", solicitudRoutes);
app.use("/api/usuario", usuarioRoutes);
app.use("/api/ventas", ventaRoutes);
app.use("/api/comprador", compradorRoutes);

app.listen(8081, () => console.log('Servidor corriendo en http://localhost:8081'));
