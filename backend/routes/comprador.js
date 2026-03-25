import express from "express";
import {
  getcompradores,
  createcomprador,
  updatecomprador,
  deletecomprador,
  getcompradorByUsuario,
} from "../controllers/comprador.js";
import authMiddleware from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get("/", getcompradores);
router.post("/", createcomprador);
router.get("/usuario/:usuarioId", getcompradorByUsuario); // ✅ muévela aquí arriba
router.put("/:id", updatecomprador);
router.delete("/:id", deletecomprador);

export default router;
