import express from "express";
import {
  getResenasByComprador,
  getResenasByCaficultor,
  createResena,
  updateResena,
  deleteResena,
} from "../controllers/reseña.js"; // ✅ era resenaController.js (no existía)

const router = express.Router();

router.get("/comprador/:compradorId", getResenasByComprador);
router.get("/caficultor/:caficultorId", getResenasByCaficultor);
router.post("/", createResena);
router.put("/:id", updateResena);
router.delete("/:id", deleteResena);

export default router;