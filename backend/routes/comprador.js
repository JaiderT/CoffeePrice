import express from "express";
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

router.get("/", authMiddleware, roleMiddleware("admin"), getcompradores);
router.post("/", authMiddleware, createcomprador);
router.get("/usuario/:usuarioId", authMiddleware, getcompradorByUsuario);
router.get("/:id", async (req, res) => {
  try {
    const comprador = await CompradorModel.findById(req.params.id);
    if (!comprador) return res.status(404).json({ message: "Comprador no encontrado" });
    res.json(comprador);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener comprador", error: error.message });
  }
});
router.put("/:id", authMiddleware, updatecomprador);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deletecomprador);

export default router;
