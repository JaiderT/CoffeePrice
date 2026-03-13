import express from "express";
import { getprecios } from "../controllers/precio.js";
import { getpreciosBycomprador } from "../controllers/precio.js";
import { createprecio } from "../controllers/precio.js";
import { updateprecio } from "../controllers/precio.js";
import { deleteprecio } from "../controllers/precio.js";

const router = express.Router();

router.get("/", getprecios);
router.get("/", getpreciosBycomprador);
router.post("/", createprecio);
router.put("/", updateprecio);
router.delete("/", deleteprecio);

export default router;