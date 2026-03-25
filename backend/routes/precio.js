import express from "express";
import {
  getprecios,
  getpreciosBycomprador,
  createprecio,
  updateprecio,
  deleteprecio,
} from "../controllers/precio.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/rolMiddleware.js";

const router = express.Router();

router.get("/", getprecios);
router.get("/comprador/:compradorId", getpreciosBycomprador); 
router.post("/", authMiddleware, roleMiddleware("comprador", "admin"), createprecio);
router.put("/:id", authMiddleware, roleMiddleware("comprador", "admin"), updateprecio);
router.delete("/:id", authMiddleware, roleMiddleware("comprador", "admin"), deleteprecio); 

export default router;