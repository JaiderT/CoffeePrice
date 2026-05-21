import cron from 'node-cron';
import puppeteer from 'puppeteer';
import axios from 'axios';
import PrecioFNC from '../models/PrecioFNC.js';

// Cache RAM — se recarga desde MongoDB al arrancar
export let cachePrecioFNC = { precio: null, timestamp: 0, fuente: null };
let actualizacionPrecioFNCPromise = null;

// ── Persistir en MongoDB ─────────────────────────────────────────────
async function guardarEnDB(precio, fuente) {
  try {
    await PrecioFNC.findOneAndUpdate(
      {},
      { precio, fuente, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (e) {
    console.warn('[precioCron] No se pudo guardar en DB:', e.message);
  }
}

// ── Cargar desde MongoDB al iniciar (sobrevive reinicios) ────────────
async function cargarDesdeDB() {
  try {
    const doc = await PrecioFNC.findOne().sort({ updatedAt: -1 });
    if (doc?.precio) {
      cachePrecioFNC = {
        precio: doc.precio,
        fuente: doc.fuente || 'fnc-directo',
        timestamp: new Date(doc.updatedAt).getTime(),
      };
      console.log(`[precioCron] Precio cargado desde DB: $${doc.precio.toLocaleString('es-CO')}`);
    }
  } catch (e) {
    console.warn('[precioCron] No se pudo leer DB al iniciar:', e.message);
  }
}

// ── Fuente 1: Scraping real de la FNC con Puppeteer ──────────────────
async function scrapearFNC() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process',        // ← importante en Railway
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
    await new Promise(r => setTimeout(r, 3000));

    const precio = await page.evaluate(() => {
      for (const el of document.querySelectorAll('*')) {
        if (el.children.length > 0) continue;
        const texto = el.innerText?.trim() || '';
        const match = texto.match(/\b(\d{1,3}(?:[.,]\d{3})+)\b/);
        if (match) {
          const num = parseInt(match[1].replace(/[.,]/g, ''), 10);
          if (num >= 800000 && num <= 8000000) return num;
        }
      }
      return null;
    });

    return precio;
  } finally {
    await browser.close();
  }
}

// ── Fuente 2: Precio NY convertido a COP/carga ───────────────────────
async function precioDesdeNY() {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/KC=F?interval=1d&range=2d';
  const { data } = await axios.get(url, {
    timeout: 8000,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const ny = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (!ny || ny <= 0) throw new Error('Sin precio NY válido');

  // Fórmula: ¢/lb → USD/lb → USD/kg → USD/125kg(carga) → COP
  // Factor TRM dinámico via API pública
  let trm = 4200; // fallback
  try {
    const resTRM = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', { timeout: 5000 });
    trm = resTRM.data?.rates?.COP || 4200;
  } catch { /* usa fallback */ }

  const precioUSDCarga = (ny / 100) * 0.453592 * 125; // ¢/lb → USD/carga (125kg)
  const precio = Math.round(precioUSDCarga * trm * 0.95); // 5% descuento local típico

  if (precio < 800_000 || precio > 8_000_000) throw new Error('Precio fuera de rango');
  return { precio, fuente: 'ny-estimado' };
}

// ── Función principal de actualización ──────────────────────────────
export async function actualizarPrecioFNC() {
  if (actualizacionPrecioFNCPromise) return actualizacionPrecioFNCPromise;

  actualizacionPrecioFNCPromise = (async () => {
    console.log('[precioCron] Actualizando precio FNC...');

    // Intentar scraping real
    try {
      const precio = await scrapearFNC();
      if (precio) {
        cachePrecioFNC = { precio, timestamp: Date.now(), fuente: 'fnc-directo' };
        await guardarEnDB(precio, 'fnc-directo');
        console.log(`[precioCron] ✓ FNC directo: $${precio.toLocaleString('es-CO')}`);
        return;
      }
    } catch (e) {
      console.warn('[precioCron] Puppeteer falló:', e.message);
    }

    // Fallback: precio NY
    try {
      const { precio, fuente } = await precioDesdeNY();
      cachePrecioFNC = { precio, timestamp: Date.now(), fuente };
      await guardarEnDB(precio, fuente);
      console.log(`[precioCron] ✓ NY estimado: $${precio.toLocaleString('es-CO')}`);
    } catch (e) {
      console.warn('[precioCron] Yahoo Finance también falló:', e.message);
    }
  })();

  try {
    await actualizacionPrecioFNCPromise;
  } finally {
    actualizacionPrecioFNCPromise = null;
  }
}

export function hayActualizacionPrecioFNCEnCurso() {
  return Boolean(actualizacionPrecioFNCPromise);
}

// ── Iniciar cron ─────────────────────────────────────────────────────
export async function iniciarCronPrecioFNC() {
  // 1. Cargar último precio guardado (inmediato, sin esperar scraping)
  await cargarDesdeDB();

  // 2. Si el precio en DB tiene más de 4 horas, actualizar ya
  const cuatroHoras = 4 * 60 * 60 * 1000;
  const esViejo = !cachePrecioFNC.timestamp || 
    (Date.now() - cachePrecioFNC.timestamp) > cuatroHoras;

  if (esViejo) {
    console.log('[precioCron] Precio desactualizado, actualizando en background...');
    actualizarPrecioFNC().catch(e => console.error('[precioCron]', e.message));
  }

  // 3. Cron L-V 8am y 1pm hora Colombia
  cron.schedule('0 8,13 * * 1-5', () => {
    actualizarPrecioFNC();
  }, { timezone: 'America/Bogota' });

  console.log('[precioCron] Cron precio FNC activo (L-V 8am y 1pm Colombia)');
}