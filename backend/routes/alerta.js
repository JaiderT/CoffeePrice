import express from "express";
import Alerta from "../models/alerta.js";
import {
  getAlertasByUsuario,
  getAlertaById,
  createAlerta,
  updateAlerta,
  toggleAlerta,
  deleteAlerta,
} from "../controllers/alerta.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/rolMiddleware.js";

const router = express.Router();

router.get("/usuario/:usuarioId", authMiddleware, roleMiddleware("productor", "admin"), getAlertasByUsuario);
router.get("/verificar/:usuarioId", authMiddleware, async (req, res) => {
  try {
    const esAdmin = req.user?.rol === "admin";
    const esPropietario = req.user?.id === req.params.usuarioId;

    if (!esAdmin && !esPropietario) {
      return res.status(403).json({ message: 'No tienes permisos para ver estas alertas' });
    }

    const alertas = await Alerta.find({
      usuario: req.params.usuarioId,
      activa: true,
      ultimaNotificacion: { $gte: new Date(Date.now() - 60000) }
    }).populate('comprador', 'nombreempresa');
    res.json(alertas);
  } catch (error) {
    console.error('[Alerta] Error verificando alertas:', error.message);
    res.status(500).json({ message: 'Error al verificar alertas' });
  }
});
router.get("/:id", authMiddleware, roleMiddleware("productor", "admin"), getAlertaById);
router.post("/", authMiddleware, roleMiddleware("productor", "admin"), createAlerta);
router.put("/:id", authMiddleware, roleMiddleware("productor", "admin"), updateAlerta);
router.put("/:id/toggle", authMiddleware, roleMiddleware("productor", "admin"), toggleAlerta);
router.delete("/:id", authMiddleware, roleMiddleware("productor", "admin"), deleteAlerta);

export default router;
