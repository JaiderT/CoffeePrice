import express from "express";
import { solicitarCodigo, cambiarPassword } from "../controllers/recuperar.js";
import { recoveryLimiter } from "../middlewares/rateLimit.js";

const router = express.Router();

router.post('/solicitar-codigo', recoveryLimiter, solicitarCodigo);

router.post('/cambiar-password', recoveryLimiter, cambiarPassword);

export default router;