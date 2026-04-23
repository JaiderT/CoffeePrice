import express from 'express';
import { cachePrecioFNC, actualizarPrecioFNC } from '../jobs/precioCron.js';

const router = express.Router();

router.get('/', async (req, res) => {
  // Si el cron ya tiene precio, devolverlo directo
  if (cachePrecioFNC.precio) {
    return res.json({
      precio: cachePrecioFNC.precio,
      fuente: cachePrecioFNC.fuente,
      actualizadoEn: new Date(cachePrecioFNC.timestamp).toLocaleString('es-CO'),
    });
  }

  // Primera vez que se llama (cron aún no corrió), obtener ahora
  try {
    await actualizarPrecioFNC();
    if (cachePrecioFNC.precio) {
      return res.json({
        precio: cachePrecioFNC.precio,
        fuente: cachePrecioFNC.fuente,
        actualizadoEn: new Date(cachePrecioFNC.timestamp).toLocaleString('es-CO'),
      });
    }
  } catch (e) {
    console.error('[precioFNC] Error al obtener precio:', e.message);
  }

  return res.status(503).json({
    message: 'No se pudo obtener el precio de la FNC en este momento',
  });
});

export default router;