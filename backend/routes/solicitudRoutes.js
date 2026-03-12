import express from "express";
import {
    getSolicitudesByCaficultor,
    getSolicitudesByComprador,
    getSolicitudById,
    createSolicitud,
    responderSolicitud,
    deleteSolicitud,
} from "../controllers/solicitudControllers.js";

const router = express.Router();

router.get("/caficultor/:caficultorId", getSolicitudesByCaficultor);
router.get("/comprador/:compradorId", getSolicitudesByComprador);
router.get("/:id", getSolicitudById);
router.post("/", createSolicitud);
router.put("/:id/responder", responderSolicitud);
router.delete("/:id", deleteSolicitud);

export default router;