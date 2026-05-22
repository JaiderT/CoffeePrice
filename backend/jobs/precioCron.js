import cron from 'node-cron';
import puppeteer from 'puppeteer';
import axios from 'axios';

const TIME_ZONE = 'America/Bogota';
const EDAD_MAXIMA_CACHE_MS = 18 * 60 * 60 * 1000;
const INTERVALO_REINTENTO_TARDE_MS = 30 * 60 * 1000;
const HORA_INICIO_VENTANA_TARDE = 13;
const HORA_FIN_VENTANA_TARDE = 16;

// Cache compartida leida por precioFNC.js
export let cachePrecioFNC = { precio: null, timestamp: 0, fuente: null };
let actualizacionPrecioFNCPromise = null;
let ultimoIntentoActualizacionMs = 0;

function obtenerPartesBogota(fecha = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(fecha)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: parts.weekday,
  };
}

function esDiaHabilFNC(fecha = new Date()) {
  const { weekday } = obtenerPartesBogota(fecha);
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(weekday);
}

function esMismaFechaBogota(fechaA, fechaB) {
  return obtenerPartesBogota(fechaA).dateKey === obtenerPartesBogota(fechaB).dateKey;
}

function deberiaReintentarEnVentanaTarde(fecha = new Date()) {
  if (!ultimoIntentoActualizacionMs || !esDiaHabilFNC(fecha)) return false;

  const { hour } = obtenerPartesBogota(fecha);
  if (hour < HORA_INICIO_VENTANA_TARDE || hour >= HORA_FIN_VENTANA_TARDE) return false;

  const ultimoIntento = new Date(ultimoIntentoActualizacionMs);
  if (!esMismaFechaBogota(ultimoIntento, fecha)) return true;

  return fecha.getTime() - ultimoIntentoActualizacionMs >= INTERVALO_REINTENTO_TARDE_MS;
}

export function necesitaActualizarPrecioFNC(fecha = new Date()) {
  if (!cachePrecioFNC.precio || !cachePrecioFNC.timestamp) return true;

  const edadMs = fecha.getTime() - cachePrecioFNC.timestamp;
  if (edadMs >= EDAD_MAXIMA_CACHE_MS) return true;

  if (!esMismaFechaBogota(new Date(cachePrecioFNC.timestamp), fecha) && esDiaHabilFNC(fecha)) {
    const { hour } = obtenerPartesBogota(fecha);
    if (hour >= 8) return true;
  }

  return deberiaReintentarEnVentanaTarde(fecha);
}

// Fuente 1: Scraping real de la FNC con Puppeteer
async function scrapearFNC() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--disable-extensions',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    );
    await page.goto('https://federaciondecafeteros.org/wp/listado-precios-cafe/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const precio = await page.evaluate(() => {
      for (const el of document.querySelectorAll('*')) {
        if (el.children.length > 0) continue;
        const texto = el.innerText?.trim() || '';
        const match = texto.match(/\b(\d{1,3}(?:[.,]\d{3})+)\b/);
        if (!match) continue;

        const num = parseInt(match[1].replace(/[.,]/g, ''), 10);
        if (num >= 800000 && num <= 8000000) return num;
      }

      return null;
    });

    return precio;
  } finally {
    await browser.close();
  }
}

// Fuente 2: Precio NY convertido a COP/carga
// Factor calibrado: NY=300.9 c/lb -> FNC=2,200,000 COP/carga (abril 2025)
async function precioDesdeNY() {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/KC=F?interval=1d&range=2d';
  const { data } = await axios.get(url, {
    timeout: 8000,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  const ny = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (!ny || ny <= 0) throw new Error('Sin precio NY valido');

  const precio = Math.round((ny / 100) * 275.58 * 2654);
  if (precio < 800_000 || precio > 8_000_000) throw new Error('Precio fuera de rango');

  return { precio, fuente: 'ny-estimado' };
}

// Funcion principal de actualizacion
export async function actualizarPrecioFNC() {
  if (actualizacionPrecioFNCPromise) {
    return actualizacionPrecioFNCPromise;
  }

  actualizacionPrecioFNCPromise = (async () => {
    ultimoIntentoActualizacionMs = Date.now();
    console.log('[precioCron] Actualizando precio FNC...');

    try {
      const precio = await scrapearFNC();
      if (precio) {
        cachePrecioFNC = { precio, timestamp: Date.now(), fuente: 'fnc-directo' };
        console.log(`[precioCron] OK FNC directo: $${precio.toLocaleString('es-CO')} COP/carga`);
        return cachePrecioFNC;
      }
    } catch (error) {
      console.warn('[precioCron] Puppeteer fallo:', error.message);
    }

    try {
      const { precio, fuente } = await precioDesdeNY();
      cachePrecioFNC = { precio, timestamp: Date.now(), fuente };
      console.log(`[precioCron] OK NY estimado: $${precio.toLocaleString('es-CO')} COP/carga`);
      return cachePrecioFNC;
    } catch (error) {
      console.warn('[precioCron] Yahoo Finance tambien fallo:', error.message);
    }

    return cachePrecioFNC;
  })();

  try {
    return await actualizacionPrecioFNCPromise;
  } finally {
    actualizacionPrecioFNCPromise = null;
  }
}

export function hayActualizacionPrecioFNCEnCurso() {
  return Boolean(actualizacionPrecioFNCPromise);
}

// Iniciar cron
export function iniciarCronPrecioFNC() {
  actualizarPrecioFNC().catch((error) => {
    console.error('[precioCron] Error en carga inicial:', error.message);
  });

  cron.schedule(
    '0 8,13 * * 1-5',
    () => {
      actualizarPrecioFNC().catch((error) => {
        console.error('[precioCron] Error en cron programado:', error.message);
      });
    },
    { timezone: TIME_ZONE }
  );

  console.log('[precioCron] Cron precio FNC activo (L-V 8am y 1pm Colombia)');
}
