import express from "express";
import jwt from "jsonwebtoken"; // ← NUEVO
import CompradorModel from "../models/comprador.js";
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
    const token = req.headers.authorization?.split(' ')[1];
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

router.get('/:id', authOpcional, async (req, res) => { // ← authOpcional agregado
  try {
    if (req.user) { // ← verifica usuario real, no solo el header
      const completo = await CompradorModel.findById(req.params.id);
      if (!completo) return res.status(404).json({ message: 'Comprador no encontrado' });
      return res.json(completo);
    }

    const camposPublicos = 'nombreempresa direccion horario';
    const comprador = await CompradorModel.findById(req.params.id).select(camposPublicos);
    if (!comprador) return res.status(404).json({ message: 'Comprador no encontrado' });
    res.json(comprador);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener comprador', error: error.message });
  }
});

router.put("/:id", authMiddleware, updatecomprador);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deletecomprador);

export default router;