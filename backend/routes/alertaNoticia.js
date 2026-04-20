import express from "express";
import {
  getAlertaNoticia,
  upsertAlertaNoticia,
  deleteAlertaNoticia,
  toggleAlertaNoticia,
} from "../controllers/alertaNoticia.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/usuario/:usuarioId", authMiddleware, getAlertaNoticia);
router.post("/", authMiddleware, upsertAlertaNoticia);
router.delete("/", authMiddleware, deleteAlertaNoticia);
router.put("/toggle", authMiddleware, toggleAlertaNoticia);

export default router;
