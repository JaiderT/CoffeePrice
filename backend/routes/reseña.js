import express from "express";
import {
  getReseñasByComprador,
  getReseñasByProductor,
  createReseña,
  updateReseña,
  deleteReseña,
} from "../controllers/reseña.js"; 
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/rolMiddleware.js";


const router = express.Router();

router.get("/comprador/:compradorId", getReseñasByComprador);
router.get("/productor/:productorId", getReseñasByProductor);
router.post("/", authMiddleware, roleMiddleware("productor"), createReseña);
router.put("/:id", authMiddleware, roleMiddleware("productor", "admin"), updateReseña);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteReseña);


export default router;