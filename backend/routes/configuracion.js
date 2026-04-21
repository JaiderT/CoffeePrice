import express from "express";
import { getConfiguracion, updateConfiguracion } from "../controllers/configuracion.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/rolMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("admin"), getConfiguracion);
router.put("/", authMiddleware, roleMiddleware("admin"), updateConfiguracion);

export default router;
