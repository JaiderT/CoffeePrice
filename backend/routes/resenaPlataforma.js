import express from "express";
import {
  getReseñasAprobadas,
  getTodasReseñas,
  createReseña,
  aprobarReseña,
  deleteReseña,
} from "../controllers/resenaPlataforma.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import rolMiddleware from "../middlewares/rolMiddleware.js";

const router = express.Router();

router.get("/", getReseñasAprobadas);
router.get("/todas", authMiddleware, rolMiddleware("admin"), getTodasReseñas);
router.post("/", authMiddleware, createReseña);
router.put("/:id/aprobar", authMiddleware, rolMiddleware("admin"), aprobarReseña);
router.delete("/:id", authMiddleware, rolMiddleware("admin"), deleteReseña);

export default router;
