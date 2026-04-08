import express from "express";
import { 
    getPredicciones,
    getUltimaPrediccion,
    getResumenPredicciones,
    getPrediccionesPorRango,
    getPrediccionPorDia,
    getPrediccionPorFecha,
    getPrediccionById,
    createPrediccion,
    updatePrediccion,
    deletePrediccion,
} from "../controllers/prediccionControllers.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/rolMiddleware.js";

const router = express.Router();

router.get("/", getPredicciones);
router.get("/ultima", getUltimaPrediccion);
router.get("/resumen", getResumenPredicciones);
router.get("/rango", getPrediccionesPorRango);
router.get("/dia", getPrediccionPorDia);
router.get("/fecha", getPrediccionPorFecha);
router.get("/:id", getPrediccionById);
router.post("/", authMiddleware, roleMiddleware("admin"), createPrediccion);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updatePrediccion);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deletePrediccion);

export default router;