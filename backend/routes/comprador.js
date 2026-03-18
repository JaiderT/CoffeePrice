import express from "express";
import {
  getcompradores,
  createcomprador,
  updatecomprador,
  deletecomprador,
} from "../controllers/comprador.js";

const router = express.Router();

router.get("/", getcompradores);
router.post("/", createcomprador);
router.put("/:id", updatecomprador);
router.delete("/:id", deletecomprador);

export default router;
