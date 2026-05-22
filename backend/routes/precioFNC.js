import express from 'express';
import {
  cachePrecioFNC,
  actualizarPrecioFNC,
  hayActualizacionPrecioFNCEnCurso,
  necesitaActualizarPrecioFNC,
} from '../jobs/precioCron.js';

const router = express.Router();

function construirRespuestaPrecio(precioCache) {
  return {
    precio: precioCache?.precio ?? null,
    fuente: precioCache?.fuente ?? null,
    actualizadoEn: precioCache?.timestamp
      ? new Date(precioCache.timestamp).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
      : null,
  };
}

router.get('/', async (req, res) => {
  const hayCache = Boolean(cachePrecioFNC.precio);
  const precioVencido = necesitaActualizarPrecioFNC();

  if (hayCache) {
    if (precioVencido && !hayActualizacionPrecioFNCEnCurso()) {
      actualizarPrecioFNC().catch((error) => {
        console.error('[precioFNC] Error al refrescar precio en segundo plano:', error.message);
      });
    }

    return res.json(construirRespuestaPrecio(cachePrecioFNC));
  }

  if (hayActualizacionPrecioFNCEnCurso()) {
    return res.status(hayCache ? 200 : 202).json({
      ...construirRespuestaPrecio(cachePrecioFNC),
      stale: hayCache,
      message: hayCache
        ? 'Se esta refrescando el precio FNC. Se entrega temporalmente el ultimo valor disponible.'
        : 'Actualizando precio FNC. Intenta nuevamente en unos segundos.',
    });
  }

  try {
    await actualizarPrecioFNC();
  } catch (error) {
    console.error('[precioFNC] Error al actualizar precio:', error.message);
  }

  if (cachePrecioFNC.precio) {
    return res.json({
      ...construirRespuestaPrecio(cachePrecioFNC),
      stale: false,
    });
  }

  return res.status(503).json({
    ...construirRespuestaPrecio(cachePrecioFNC),
    stale: true,
    message: 'No fue posible actualizar el precio FNC en este momento.',
  });
});

export default router;
