import express from "express";
import { getHistorial, getHistorialByComprador } from "../controllers/historialPrecio.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getHistorial);
router.get("/comprador/:compradorId", authMiddleware, getHistorialByComprador);

export default router;
