import express from "express";
import jwt from "jsonwebtoken"; // ← NUEVO
import CompradorModel from "../models/comprador.js";
import Usuario from "../models/usuario.js";
import {
  getcompradores,
  createcomprador,
  updatecomprador,
  deletecomprador,
  getcompradorByUsuario,
} from "../controllers/comprador.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/rolMiddleware.js";

const router = express.Router();

// ← NUEVO: middleware opcional que no bloquea si no hay token
const authOpcional = (req, res, next) => {
    let token = req.cookies?.auth_token;
    if (!token) {
        token = req.headers.authorization?.split(' ')[1];
    }
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch { /* token inválido → anónimo */ }
    }
    next();
};

router.get("/", authMiddleware, roleMiddleware("admin"), getcompradores);
router.post("/", authMiddleware, roleMiddleware("comprador"), createcomprador);
router.get("/usuario/:usuarioId", authMiddleware, getcompradorByUsuario);
router.get("/mapa", async (req, res) => {
    try {
        const compradores = await CompradorModel.find({
            latitud: { $ne: null },
            longitud: { $ne: null },
        })
        .select("nombreempresa direccion telefono horarioApertura horarioCierre latitud longitud")
        .lean();
        res.json(compradores);
    } catch (error) {
        res.status(500).json({ message: "Error obteniendo mapa", error: error.message });
    }
});

router.get('/:id', authOpcional, async (req, res) => { // ← authOpcional agregado
  try {
    const comprador = await CompradorModel.findById(req.params.id);
    if (!comprador) return res.status(404).json({ message: 'Comprador no encontrado' });

    if (!req.user) {
      return res.json({
        _id: comprador._id,
        nombreempresa: comprador.nombreempresa,
        direccion: comprador.direccion,
        telefono: comprador.telefono,
        horarioApertura: comprador.horarioApertura,
        horarioCierre: comprador.horarioCierre,
        latitud: comprador.latitud,
        longitud: comprador.longitud,
      });
    }

    const usuarioSolicitante = await Usuario.findById(req.user.id).select("rol");
    const esAdmin = usuarioSolicitante?.rol === "admin";
    const esPropietario = comprador.usuario?.toString() === req.user.id;

    if (!esAdmin && !esPropietario) {
      return res.json({
        _id: comprador._id,
        nombreempresa: comprador.nombreempresa,
        direccion: comprador.direccion,
        telefono: comprador.telefono,
        horarioApertura: comprador.horarioApertura,
        horarioCierre: comprador.horarioCierre,
        latitud: comprador.latitud,
        longitud: comprador.longitud,
      });
    }

    return res.json(comprador);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener comprador' });
  }
});

router.put("/:id", authMiddleware, updatecomprador);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deletecomprador);

export default router;
