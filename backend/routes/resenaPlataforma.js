import express from "express";
import {
  getResenasAprobadas,
  getTodasResenas,
  createResena,
  aprobarResena,
  deleteResena,
} from "../controllers/resenaPlataforma.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import rolMiddleware from "../middlewares/rolMiddleware.js";

const router = express.Router();

router.get("/", getResenasAprobadas);
router.get("/todas", authMiddleware, rolMiddleware("admin"), getTodasResenas);
router.post("/", authMiddleware, createResena);
router.put("/:id/aprobar", authMiddleware, rolMiddleware("admin"), aprobarResena);
router.delete("/:id", authMiddleware, rolMiddleware("admin"), deleteResena);

export default router;
