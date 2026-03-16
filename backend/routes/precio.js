import express from "express";
import {
  getprecios,
  getpreciosBycomprador,
  createprecio,
  updateprecio,
  deleteprecio,
} from "../controllers/precio.js";

const router = express.Router();

router.get("/", getprecios);
router.get("/comprador/:compradorId", getpreciosBycomprador); // ✅ era GET "/" duplicado
router.post("/", createprecio);
router.put("/:id", updateprecio);    // ✅ era PUT "/" sin :id
router.delete("/:id", deleteprecio); // ✅ era DELETE "/" sin :id

export default router;