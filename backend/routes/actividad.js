import express from "express";
import Usuario from "../models/usuario.js";
import Precio from "../models/precio.js";
import Noticia from "../models/noticia.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import rolMiddleware from "../middlewares/rolMiddleware.js";

const router = express.Router();

// GET /api/actividad — solo admin
router.get("/", authMiddleware, rolMiddleware("admin"), async (req, res) => {
  try {
    const eventos = [];

    // Últimos 5 usuarios registrados
    const usuarios = await Usuario.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("nombre apellido rol createdAt")
      .lean();

    for (const u of usuarios) {
      const rolLabel =
        u.rol === "productor" ? "caficultor" :
        u.rol === "comprador" ? "comprador" : "admin";
      eventos.push({
        tipo: "usuario",
        texto: `${u.nombre} ${u.apellido} se registró como ${rolLabel}`,
        fecha: u.createdAt,
        color: "#22C55E",
      });
    }

    // Últimos 3 precios actualizados
    const precios = await Precio.find()
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate("comprador", "nombreempresa")
      .select("preciocarga tipocafe updatedAt comprador")
      .lean();

    for (const p of precios) {
      eventos.push({
        tipo: "precio",
        texto: `${p.comprador?.nombreempresa || "Comprador"} actualizó precio a $${p.preciocarga.toLocaleString("es-CO")} (${p.tipocafe.replace("_", " ")})`,
        fecha: p.updatedAt,
        color: "#C8A96E",
      });
    }

    // Últimas 3 noticias publicadas
    const noticias = await Noticia.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select("titulo createdAt")
      .lean();

    for (const n of noticias) {
      eventos.push({
        tipo: "noticia",
        texto: `Noticia publicada: "${n.titulo}"`,
        fecha: n.createdAt,
        color: "#3B82F6",
      });
    }

    // Ordenar por fecha desc y devolver los 6 más recientes
    eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json(eventos.slice(0, 6));
  } catch (error) {
    console.error("[Actividad] Error:", error.message);
    res.status(500).json({ message: "Error al obtener actividad reciente" });
  }
});

export default router;