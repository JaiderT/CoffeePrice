import express from "express";
import { 
    getNoticias,
    getNoticiaById,
    createNoticia,
    updateNoticia,
    deleteNoticia,
    limpiarNoticiasDanadasController,
} from "../controllers/noticiaControllers.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/rolMiddleware.js";
import { generarNoticiasDelDia } from '../services/noticiaAutoService.js';

const router = express.Router();

router.get("/", getNoticias);
router.get("/:id", getNoticiaById);
router.post("/", authMiddleware, roleMiddleware("admin"), createNoticia);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateNoticia);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteNoticia);
router.post("/limpiar-danadas", authMiddleware, roleMiddleware("admin"), limpiarNoticiasDanadasController);
router.post('/generar-automaticas', authMiddleware, roleMiddleware('admin'),
    async (req, res) => {
        try {
            const creadas = await generarNoticiasDelDia(); 
            res.json({
                message: `${creadas} noticias generadas correctamente`,
                creadas,
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error al generar noticias',
                error: error.message
            });
        }
    }
);


export default router;
