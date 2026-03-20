import express from "express";
import { solicitarCodigo, cambiarPassword } from "../controllers/recuperar.js";

const router = express.Router();

router.post('/solicitar-codigo', solicitarCodigo);

router.post('/cambiar-password', cambiarPassword);

export default router;