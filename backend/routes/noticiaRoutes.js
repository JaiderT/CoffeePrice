import express from "express";
import { 
    getNoticias,
    getNoticiaById,
    createNoticia,
    updateNoticia,
    deleteNoticia,
} from "../controllers/noticiaControllers.js";

const router = express.Router();

router.get("/", getNoticias);
router.get("/:id", getNoticiaById);
router.post("/", createNoticia);
router.put("/:id", updateNoticia);
router.delete("/:id", deleteNoticia);

export default router;