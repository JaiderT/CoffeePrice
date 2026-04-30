import express from 'express';
import { cachePrecioFNC, actualizarPrecioFNC, hayActualizacionPrecioFNCEnCurso } from '../jobs/precioCron.js';

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

  // Si ya hay una actualización en curso, no duplicar trabajo pesado
  if (hayActualizacionPrecioFNCEnCurso()) {
    return res.status(202).json({
      message: 'Actualizando precio FNC. Intenta nuevamente en unos segundos.',
      precio: null,
      fuente: null,
      actualizadoEn: null,
    });
  }

  // Primera vez que se llama: lanzar actualización en segundo plano
  try {
    actualizarPrecioFNC().catch((e) => {
      console.error('[precioFNC] Error en actualización en segundo plano:', e.message);
    });
  } catch (e) {
    console.error('[precioFNC] Error al obtener precio:', e.message);
  }

  return res.status(202).json({
    message: 'Precio FNC en actualización. Intenta nuevamente en unos segundos.',
    precio: null,
    fuente: null,
    actualizadoEn: null,
  });
});

export default router;
