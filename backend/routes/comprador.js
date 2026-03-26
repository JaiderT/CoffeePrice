import express from "express";
import {
  getcompradores,
  createcomprador,
  updatecomprador,
  deletecomprador,
  getcompradorByUsuario,
} from "../controllers/comprador.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/rolMiddleware.js"

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware,getcompradores);
router.post("/", authMiddleware, createcomprador);
router.get("/usuario/:usuarioId", authMiddleware, getcompradorByUsuario);
router.put("/:id", authMiddleware, updatecomprador);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deletecomprador);

export default router;
