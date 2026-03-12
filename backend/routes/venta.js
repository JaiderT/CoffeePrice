import express from "express";
import {
  getVentasByCaficultor,
  getVentasByComprador,
  getVentaById,
  createVenta,
  actualizarEstadoPago,
  deleteVenta,
} from "../controllers/ventaController.js";

const router = express.Router();

router.get("/caficultor/:caficultorId", getVentasByCaficultor);
router.get("/comprador/:compradorId", getVentasByComprador);
router.get("/:id", getVentaById);
router.post("/", createVenta);
router.put("/:id/pago", actualizarEstadoPago);
router.delete("/:id", deleteVenta);

export default router;
