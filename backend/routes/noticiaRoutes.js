import express from "express";
import { 
    getNoticias,
    getNoticiaById,
    createNoticia,
    updateNoticia,
    deleteNoticia,
} from "../controllers/noticiaControllers.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/rolMiddleware.js";

const router = express.Router();

router.get("/", getNoticias);
router.get("/:id", getNoticiaById);
router.post("/", authMiddleware, roleMiddleware("admin"), createNoticia);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateNoticia);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteNoticia);


export default router;