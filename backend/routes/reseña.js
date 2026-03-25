import express from "express";
import {
  getReseñasByComprador,
  getReseñasByProductor,
  createReseña,
  updateReseña,
  deleteReseña,
} from "../controllers/reseña.js"; 

const router = express.Router();

router.get("/comprador/:compradorId", getReseñasByComprador);
router.get("/productor/:productorId", getReseñasByProductor);
router.post("/", createReseña);
router.put("/:id", updateReseña);
router.delete("/:id", deleteReseña);

export default router;