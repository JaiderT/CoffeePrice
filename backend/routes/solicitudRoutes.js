import express from "express";
import {
    getSolicitudesByProductor,
    getSolicitudesByComprador,
    getSolicitudById,
    createSolicitud,
    responderSolicitud,
    cerrarSolicitud,
    deleteSolicitud,
} from "../controllers/solicitudControllers.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/rolMiddleware.js";

const router = express.Router();

router.get("/productor/:productorId", authMiddleware, getSolicitudesByProductor);
router.get("/comprador/:compradorId", authMiddleware, getSolicitudesByComprador);
router.get("/:id", authMiddleware, getSolicitudById);
router.post("/", authMiddleware, roleMiddleware("productor"), createSolicitud);
router.put("/:id/responder", authMiddleware, roleMiddleware("comprador", "admin"), responderSolicitud);
router.put("/:id/cerrar", authMiddleware, roleMiddleware("comprador", "admin"), cerrarSolicitud);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteSolicitud);


export default router;