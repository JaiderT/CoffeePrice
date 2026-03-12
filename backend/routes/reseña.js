import express from "express";
import {
  getResenasByComprador,
  getResenasByCaficultor,
  createResena,
  updateResena,
  deleteResena,
} from "../controllers/resenaController.js";

const router = express.Router();

router.get("/comprador/:compradorId", getResenasByComprador);
router.get("/caficultor/:caficultorId", getResenasByCaficultor);
router.post("/", createResena);
router.put("/:id", updateResena);
router.delete("/:id", deleteResena);

export default router;
