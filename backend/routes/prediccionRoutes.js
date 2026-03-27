import express from "express";
import { 
    getPredicciones,
    getUltimaPrediccion,
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
router.get("/:id", getPrediccionById);
router.post("/", authMiddleware, roleMiddleware("admin"), createPrediccion);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updatePrediccion);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deletePrediccion);

export default router;