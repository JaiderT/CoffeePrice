import cron from 'node-cron';
import puppeteer from 'puppeteer';
import axios from 'axios';

// Cache compartida — leída por precioFNC.js
export let cachePrecioFNC = { precio: null, timestamp: 0, fuente: null };

// ── Fuente 1: Scraping real de la FNC con Puppeteer ─────────────────
async function scrapearFNC() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
    // Esperar renderizado JS
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
// Factor calibrado: NY=300.9 ¢/lb → FNC=2,200,000 COP/carga (abril 2025)
async function precioDesdeNY() {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/KC=F?interval=1d&range=2d';
  const { data } = await axios.get(url, {
    timeout: 8000,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const ny = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (!ny || ny <= 0) throw new Error('Sin precio NY válido');
  const precio = Math.round((ny / 100) * 275.58 * 2654);
  if (precio < 800_000 || precio > 8_000_000) throw new Error('Precio fuera de rango');
  return { precio, fuente: 'ny-estimado' };
}

// ── Función principal de actualización ──────────────────────────────
export async function actualizarPrecioFNC() {
  console.log('[precioCron] Actualizando precio FNC...');

  // Intentar scraping real
  try {
    const precio = await scrapearFNC();
    if (precio) {
      cachePrecioFNC = { precio, timestamp: Date.now(), fuente: 'fnc-directo' };
      console.log(`[precioCron] ✓ FNC directo: $${precio.toLocaleString('es-CO')} COP/carga`);
      return;
    }
  } catch (e) {
    console.warn('[precioCron] Puppeteer falló:', e.message);
  }

  // Fallback: precio NY
  try {
    const { precio, fuente } = await precioDesdeNY();
    cachePrecioFNC = { precio, timestamp: Date.now(), fuente };
    console.log(`[precioCron] ✓ NY estimado: $${precio.toLocaleString('es-CO')} COP/carga`);
  } catch (e) {
    console.warn('[precioCron] Yahoo Finance también falló:', e.message);
  }
}

// ── Iniciar cron ─────────────────────────────────────────────────────
export function iniciarCronPrecioFNC() {
  // Obtener precio al arrancar el servidor
  actualizarPrecioFNC();

  // Actualizar lunes a viernes a las 8am y 1pm hora Colombia
  cron.schedule('0 8,13 * * 1-5', () => {
    actualizarPrecioFNC();
  }, { timezone: 'America/Bogota' });

  console.log('[precioCron] Cron precio FNC activo (L-V 8am y 1pm Colombia)');
}