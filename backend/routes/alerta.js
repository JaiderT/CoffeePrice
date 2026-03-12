import express from "express";
import {
  getAlertasByUsuario,
  getAlertaById,
  createAlerta,
  updateAlerta,
  toggleAlerta,
  deleteAlerta,
} from "../controllers/alertaController.js";

const router = express.Router();

router.get("/usuario/:usuarioId", getAlertasByUsuario);
router.get("/:id", getAlertaById);
router.post("/", createAlerta);
router.put("/:id", updateAlerta);
router.put("/:id/toggle", toggleAlerta);
router.delete("/:id", deleteAlerta);

export default router;
