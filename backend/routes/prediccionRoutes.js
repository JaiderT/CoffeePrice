import express from "express";
import { 
    getPredicciones,
    getUltimaPrediccion,
    getPrediccionById,
    createPrediccion,
    updatePrediccion,
    deletePrediccion,
} from "../controllers/prediccionControllers.js";

const router = express.Router();

router.get("/", getPredicciones);
router.get("/ultima", getUltimaPrediccion);
router.get("/:id", getPrediccionById);
router.post("/", createPrediccion);
router.put("/:id", updatePrediccion);
router.delete("/:id", deletePrediccion);

export default router;