import express from "express";
import {
  getAlertasByUsuario,
  getAlertaById,
  createAlerta,
  updateAlerta,
  toggleAlerta,
  deleteAlerta,
} from "../controllers/alerta.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/rolMiddleware.js";

const router = express.Router();

router.get("/usuario/:usuarioId", authMiddleware, roleMiddleware("productor", "admin"), getAlertasByUsuario);
router.get("/:id", authMiddleware, roleMiddleware("productor", "admin"), getAlertaById);
router.post("/", authMiddleware, roleMiddleware("productor", "admin"), createAlerta);
router.put("/:id", authMiddleware, roleMiddleware("productor", "admin"), updateAlerta);
router.put("/:id/toggle", authMiddleware, roleMiddleware("productor", "admin"), toggleAlerta);
router.delete("/:id", authMiddleware, roleMiddleware("productor", "admin"), deleteAlerta);


export default router;