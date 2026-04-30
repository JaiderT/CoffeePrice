import crypto from 'crypto';
import * as cheerio from 'cheerio';

// URLs verificadas abril 2026.
// Estrategia: priorizar RSS feeds (más ligeros, no bloquean bots)
// sobre scraping HTML. ICO HTML sigue siendo válido.
const FUENTES_DIRECTAS = [
    // ── ICO (URLs verificadas, responden bien) ──
    // ── La República ──
    {
        nombre: 'La República',
        url: 'https://www.larepublica.co/economia/cafe',
        categoria: 'mercado',
    },
    // ── Agronegocios ──
    {
        nombre: 'Agronegocios',
        url: 'https://www.agronegocios.co/agricultura/cafe/',
        categoria: 'produccion',
    },
    // ── FNC (timeout extendido) ──
    {
        nombre: 'FNC Huila',
        url: 'https://huila.federaciondecafeteros.org/listado-noticias/',
        categoria: 'fnc',
        timeoutMs: 20000,
    },
    {
        nombre: 'Federacion Nacional de Cafeteros',
        url: 'https://federaciondecafeteros.org/listado-noticias/',
        categoria: 'fnc',
        timeoutMs: 20000,
    },
    {
        nombre: 'Portafolio Economia',
        url: 'https://www.portafolio.co/economia',
        categoria: 'mercado',
    },
];

// RSS feeds en español — más ligeros y confiables que scraping HTML
// Nota: fuentes en inglés eliminadas; solo se consumen fuentes en español.
const FUENTES_RSS = [
    {
        nombre: 'La República RSS',
        url: 'https://www.larepublica.co/rss/economia',
        categoria: 'mercado',
    },
];

const CONSULTAS_THE_NEWS_API = [
    { categoria: 'mercado', query: 'precio cafe colombia mercado cafetero exportaciones' },
    { categoria: 'fnc', query: 'federacion nacional de cafeteros cafe colombia' },
    { categoria: 'produccion', query: 'cosecha cafe colombia produccion cafetera' },
    { categoria: 'el_pital', query: 'huila cafe caficultores el pital sur del huila' },
    { categoria: 'mercado', query: 'huila cafe precio carga compradores caficultores' },
];

const CONSULTAS_NEWSDATA = [
    { categoria: 'mercado', query: 'precio cafe colombia mercado cafetero' },
    { categoria: 'produccion', query: 'cosecha cafe colombia produccion cafetera' },
    { categoria: 'fnc', query: 'federacion nacional de cafeteros cafe colombia' },
    { categoria: 'el_pital', query: 'huila cafe caficultores el pital' },
    { categoria: 'mercado', query: 'precio cafe huila carga caficultores' },
];

const CONSULTAS_NEWSAPI = [
    { categoria: 'mercado', query: 'cafe OR cafetero OR caficultores AND Colombia' },
    { categoria: 'produccion', query: 'cosecha cafe OR produccion cafetera Colombia' },
    { categoria: 'fnc', query: '"Federacion Nacional de Cafeteros" OR caficultores Colombia' },
    { categoria: 'el_pital', query: 'Huila cafe OR "El Pital" cafe' },
];

const CONSULTAS_GNEWS = [
    { categoria: 'mercado', query: 'precio cafe Colombia mercado cafetero' },
    { categoria: 'produccion', query: 'produccion cafe Colombia cosecha' },
    { categoria: 'fnc', query: 'Federacion Nacional de Cafeteros Colombia' },
    { categoria: 'el_pital', query: 'Huila cafe caficultores' },
];

// Señales fuertes — todas en español.
// Se incluyen frases que antes eran "débiles" pero son inequívocamente
// cafeteras: "cafetero/a", "caficultor", "carga de cafe", "grano de cafe",
// "precio de la carga", "sector cafetero", "zona cafetera", etc.
// Esto permite que titulares de La República como "El café colombiano enfrenta
// presión por el dólar" o "Precio de la carga subió" pasen el filtro.
const PALABRAS_CAFE_FUERTES = [
    // Precio y mercado
    'precio del cafe', 'precio de la carga', 'precio del grano',
    'mercado del cafe', 'mercado cafetero', 'bolsa del cafe',
    'precio interno del cafe', 'precio externo del cafe',
    // Producción y cosecha
    'produccion de cafe', 'cosecha de cafe', 'cultivo de cafe',
    'recoleccion de cafe', 'beneficio del cafe', 'pergamino',
    // Exportaciones y comercio
    'exportaciones de cafe', 'cafe colombiano', 'cafe de colombia',
    'sacos de cafe', 'carga de cafe',
    // Actores institucionales
    'federacion nacional de cafeteros', 'comite de cafeteros',
    'international coffee organization', 'ico composite',
    'caficultores', 'caficultor', 'caficultura',
    // Sector y zonas
    'sector cafetero', 'sector cafetera', 'zona cafetera', 'zonas cafeteras',
    'region cafetera', 'regiones cafeteras', 'eje cafetero',
    'cafe especial', 'cafe verde', 'cafe organico', 'cafe de origen',
    // Términos que solos identifican el sector (antes eran "débiles")
    'cafetero', 'cafetera', 'cafeteros', 'cafeteras',
    'grano de cafe', 'el grano', 'carga de',
];

const PALABRAS_CAFE_DEBILES = [
    'cafe', 'grano', 'cosecha', 'cultivo', 'colombia', 'huila',
    'produccion', 'exportacion', 'agricultura', 'agro',
];

const PALABRAS_CONTEXTO_PERMITIDO = [
    'economia', 'agro', 'agricultura', 'rural', 'campo', 'productores',
    'huila', 'sur del huila', 'el pital', 'caficultores', 'federacion',
    'cooperativa', 'compradores', 'precio', 'carga', 'mercado',
];

const PALABRAS_CONTEXTO_PRODUCTIVO = [
    'agro', 'agricultura', 'rural', 'campo', 'productores',
    'huila', 'sur del huila', 'el pital', 'caficultores', 'federacion',
    'cooperativa', 'compradores', 'carga', 'grano', 'cosecha',
    'cultivo', 'fertilizantes', 'produccion', 'recoleccion',
];

const PALABRAS_CONTEXTO_LOCAL_O_GREMIAL = [
    'huila', 'sur del huila', 'el pital', 'caficultores',
    'federacion nacional de cafeteros', 'comite de cafeteros',
    'federacion', 'cooperativa cafetera',
];

const DOMINIOS_PRIORIZADOS = [
    'larepublica.co',
    'agronegocios.co',
    'federaciondecafeteros.org',
    'huila.federaciondecafeteros.org',
    'portafolio.co',
    'newsdata.io',
    'thenewsapi.com',
];

const MARCADORES_ESPANOL = [
    ' cafe ', ' caficult', ' cosecha', ' produccion', ' mercado', ' precio ',
    ' exportaciones', ' colombia', ' huila', ' federacion', ' cafeteros',
    ' agricult', ' clima ', ' lluv', ' dolar', ' carga ', ' grano ',
];

const MARCADORES_INGLES = [
    ' coffee ', ' market ', ' prices ', ' harvest ', ' growers ', ' industry ',
    ' roaster ', ' supply chain ', ' futures ', ' sustainability ', ' reports ',
    ' green coffee ', ' company ', ' companies ', ' weather ', ' trade ',
];

const PALABRAS_RUIDO = [
    'sub 17','sub17','mundial','conmebol','futbol','goleada','penal',
    'jugador','partido','liga','seleccion','tenis','baloncesto','beisbol',
    'farandula','celebridad','novela','actor','serie','asesinato',
    'capturado','policia','judicial','accidente',
];

const TEXTOS_DESCARTADOS = new Set([
    'leer mas','read more','ver mas','learn more','saber mas','ver noticia',
    'contactenos','trabaje con nosotros','mapa del sitio','politica de privacidad',
]);

const FETCH_TIMEOUT_MS_DEFAULT = 12000;

function normalizarTextoBase(texto = '') { return texto.replace(/\s+/g, ' ').trim(); }

function limpiarContenidoFuente(texto = '') {
    return normalizarTextoBase(texto)
        .replace(/\[\+\d+\s+chars\]$/i, '')
        .replace(/\[removed\]/gi, '')
        .trim();
}

function normalizarTextoBusqueda(texto = '') {
    return limpiarContenidoFuente(texto)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function esUrlHttpValida(valor = '') {
    try { const u = new URL(valor); return u.protocol === 'http:' || u.protocol === 'https:'; }
    catch { return false; }
}

function obtenerDominio(url = '') {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

function resolverUrl(baseUrl, href = '') {
    try { return new URL(href, baseUrl).toString(); } catch { return href; }
}

function contarCoincidencias(texto = '', frases = []) {
    return frases.reduce((t, f) => t + (texto.includes(f) ? 1 : 0), 0);
}

function contieneAlgunaFrase(texto = '', frases = []) {
    return frases.some((f) => texto.includes(f));
}

function tieneSenalCafeFuerte(texto = '') {
    return contarCoincidencias(texto, PALABRAS_CAFE_FUERTES) >= 1;
}

function tieneSenalCafeSuficiente(texto = '') {
    return contarCoincidencias(texto, PALABRAS_CAFE_FUERTES) >= 1
        || contarCoincidencias(texto, PALABRAS_CAFE_DEBILES) >= 2;
}

function tieneContextoPermitido(texto = '') {
    return contarCoincidencias(texto, PALABRAS_CONTEXTO_PERMITIDO) >= 1;
}

function tieneContextoProductivo(texto = '') {
    return contarCoincidencias(texto, PALABRAS_CONTEXTO_PRODUCTIVO) >= 1;
}

function esDominioPriorizado(dominio = '') {
    return DOMINIOS_PRIORIZADOS.some((base) => dominio.includes(base));
}

function esTextoMayormenteEspanol(texto = '') {
    const normalizado = ` ${normalizarTextoBusqueda(texto)} `;
    const puntosEspanol = contarCoincidencias(normalizado, MARCADORES_ESPANOL);
    const puntosIngles = contarCoincidencias(normalizado, MARCADORES_INGLES);

    if (puntosEspanol === 0) return false;
    return puntosEspanol >= puntosIngles;
}

function inferirCategoria(texto = '', categoriaBase = 'mercado') {
    const n = normalizarTextoBusqueda(texto);
    if (n.includes('el pital') || (n.includes('huila') && n.includes('caficult'))) return 'el_pital';
    if (n.includes('federacion nacional de cafeteros') || n.includes('comite de cafeteros')) return 'fnc';
    if (n.includes('clima') || n.includes('lluv') || n.includes('sequ') || n.includes('temperatura')) return 'clima';
    if (n.includes('cosecha') || n.includes('produccion') || n.includes('recoleccion') || n.includes('cultivo')) return 'produccion';
    if (n.includes('international coffee organization') || n.includes('exportaciones')) return 'internacional';
    if (n.includes('precio') || n.includes('mercado') || n.includes('carga') || n.includes('bolsa')) return 'mercado';
    return categoriaBase;
}

function normalizarArticulo(raw = {}, categoriaSugerida = 'mercado') {
    const titulo = limpiarContenidoFuente(raw.title || '');
    const resumen = limpiarContenidoFuente(raw.description || '');
    const contenido = limpiarContenidoFuente(raw.content || raw.description || '');
    const url = raw.url?.trim() || '';
    const fuente = raw.source?.name?.trim() || 'Fuente externa';
    const dominioFuente = obtenerDominio(url);
    const fechaPublicacion = raw.publishedAt || null;
    const imagenOriginal = raw.urlToImage?.trim() || '';
    const imagen = esUrlHttpValida(imagenOriginal) ? imagenOriginal : '';
    const categoria = inferirCategoria(`${titulo} ${resumen} ${contenido}`, categoriaSugerida);
    return { titulo, resumen, contenido, url, fuente, dominioFuente, fechaPublicacion, imagen, categoriaSugerida: categoria };
}

function normalizarArticuloDirecto({ titulo = '', resumen = '', contenido = '', url = '', fuente = 'Fuente directa', fechaPublicacion = null, imagen = '', categoriaSugerida = 'mercado' }) {
    return normalizarArticulo({
        title: titulo, description: resumen, content: contenido || resumen,
        url, publishedAt: fechaPublicacion, urlToImage: imagen, source: { name: fuente },
    }, categoriaSugerida);
}

function crearHashFuente(articulo = {}) {
    const base = [
        articulo.url?.trim() || '',
        articulo.titulo?.trim().toLowerCase() || '',
        articulo.fuente?.trim().toLowerCase() || '',
        articulo.fechaPublicacion || '',
    ].join('|');
    return crypto.createHash('sha256').update(base).digest('hex');
}

function deduplicarArticulos(articulos = []) {
    const vistos = new Set();
    const unicos = [];
    for (const a of articulos) {
        const h = crearHashFuente(a);
        if (!h || vistos.has(h)) continue;
        vistos.add(h);
        unicos.push({ ...a, sourceHash: h });
    }
    return unicos;
}

function esArticuloUtil(articulo = {}) {
    const titulo = normalizarTextoBusqueda(articulo.titulo || '');
    const resumen = normalizarTextoBusqueda(articulo.resumen || '');
    const contenido = normalizarTextoBusqueda(articulo.contenido || '');
    const texto = `${titulo} ${resumen} ${contenido}`.trim();
    const dominio = articulo.dominioFuente || '';
    const dominioPriorizado = esDominioPriorizado(dominio);
    const senalFuerte = tieneSenalCafeFuerte(titulo) || tieneSenalCafeFuerte(texto);
    const senalSuficiente = tieneSenalCafeSuficiente(texto);
    const contextoPermitido = tieneContextoPermitido(titulo) || tieneContextoPermitido(texto);

    if (!esUrlHttpValida(articulo.url)) return false;
    if (!titulo || titulo.length < 12) return false;
    if (!articulo.fechaPublicacion) return false;
    if (texto.includes('[removed]')) return false;
    if (titulo.includes('newsletter')) return false;
    if (articulo.dominioFuente.includes('youtube.com') || articulo.dominioFuente.includes('youtu.be')) return false;
    if (contieneAlgunaFrase(texto, PALABRAS_RUIDO)) return false;
    if (!esTextoMayormenteEspanol(texto)) return false;
    if (dominioPriorizado) return true;
    if (senalFuerte) return true;
    if (senalSuficiente && contextoPermitido) return true;
    return false;
}

function filtrarArticulosValidos(articulos = []) {
    return articulos.filter(esArticuloUtil);
}

function puntuarArticulo(articulo = {}) {
    const texto = normalizarTextoBusqueda(`${articulo.titulo || ''} ${articulo.resumen || ''} ${articulo.contenido || ''}`);
    let p = 0;
    p += contarCoincidencias(texto, PALABRAS_CAFE_FUERTES) * 6;
    p += contarCoincidencias(texto, ['caficultores','caficultura','cosecha','produccion','huila','el pital']) * 3;
    if (texto.includes('federacion nacional de cafeteros')) p += 5;
    if (texto.includes('precio del cafe')) p += 5;
    if (texto.includes('mercado del cafe')) p += 5;
    if (texto.includes('exportaciones de cafe')) p += 4;
    if (texto.includes('clima') && texto.includes('cafe')) p += 4;
    if (texto.includes('huila') && texto.includes('cafe')) p += 3;
    if (texto.includes('el pital') && texto.includes('cafe')) p += 4;
    if (contieneAlgunaFrase(texto, PALABRAS_RUIDO)) p -= 20;
    const horas = Math.max(0, (Date.now() - new Date(articulo.fechaPublicacion).getTime()) / 3600000);
    p += Math.max(0, 12 - Math.min(12, horas)) / 2;
    return p;
}

function ordenarPorRelevanciaYFecha(articulos = []) {
    return [...articulos].sort((a, b) => {
        const d = puntuarArticulo(b) - puntuarArticulo(a);
        if (d !== 0) return d;
        return new Date(b.fechaPublicacion).getTime() - new Date(a.fechaPublicacion).getTime();
    });
}

function obtenerFechaDesdeHorasAtras(horas = 12) {
    return new Date(Date.now() - horas * 3600000).toISOString();
}

function obtenerVentanasBusqueda() {
    const base = parseInt(process.env.NOTICIAS_MAX_HORAS_FUENTE || '12', 10);
    return [...new Set([base, 24, 72, 168].filter((h) => Number.isFinite(h) && h > 0))].sort((a, b) => a - b);
}

// ── JSON-LD ──
function extraerObjetosJsonLd(html = '') {
    const $ = cheerio.load(html);
    const objetos = [];
    $('script[type="application/ld+json"]').each((_, s) => {
        const c = $(s).contents().text().trim();
        if (!c) return;
        try { objetos.push(JSON.parse(c)); }
        catch { try { objetos.push(JSON.parse(c.replace(/^\uFEFF/, '').replace(/,\s*([}\]])/g, '$1'))); } catch { } }
    });
    return objetos;
}

function recolectarEntradasJsonLd(nodo, acc = []) {
    if (!nodo) return acc;
    if (Array.isArray(nodo)) { nodo.forEach((i) => recolectarEntradasJsonLd(i, acc)); return acc; }
    if (typeof nodo !== 'object') return acc;
    const tipo = Array.isArray(nodo['@type']) ? nodo['@type'].join(',') : nodo['@type'];
    if (['Article','NewsArticle','BlogPosting','Report','AnalysisNewsArticle'].some((v) => `${tipo||''}`.includes(v)) || nodo.headline || nodo.name || nodo.url) acc.push(nodo);
    if (Array.isArray(nodo.itemListElement)) nodo.itemListElement.forEach((i) => recolectarEntradasJsonLd(i?.item || i, acc));
    for (const v of Object.values(nodo)) { if (v && typeof v === 'object') recolectarEntradasJsonLd(v, acc); }
    return acc;
}

function extraerFechaDesdeTexto(texto = '') {
    const l = limpiarContenidoFuente(texto);
    if (!l) return null;
    const p = Date.parse(l);
    return !Number.isNaN(p) ? new Date(p).toISOString() : null;
}

function extraerArticulosDesdeJsonLd(html, fc) {
    const entradas = recolectarEntradasJsonLd(extraerObjetosJsonLd(html));
    return entradas.reduce((acc, e) => {
        const titulo = limpiarContenidoFuente(e.headline || e.name || '');
        const url = resolverUrl(fc.url, e.url || e.mainEntityOfPage?.['@id'] || e.mainEntityOfPage?.url || '');
        if (!titulo || !esUrlHttpValida(url)) return acc;
        const resumen = limpiarContenidoFuente(e.description || e.abstract || e.alternativeHeadline || '');
        const contenido = limpiarContenidoFuente(e.articleBody || e.text || resumen);
        const fechaPublicacion = e.datePublished || e.dateCreated || e.dateModified || null;
        const imagen = typeof e.image === 'string' ? e.image : Array.isArray(e.image) ? e.image[0] : e.image?.url || '';
        acc.push(normalizarArticuloDirecto({ titulo, resumen, contenido, url, fuente: fc.nombre, fechaPublicacion, imagen, categoriaSugerida: fc.categoria }));
        return acc;
    }, []);
}

function extraerArticulosDesdeDOM(html, fc) {
    const $ = cheerio.load(html);
    const articulos = [];
    const vistos = new Set();

    const agregar = (titulo, href, resumen, fechaPublicacion, imagen) => {
        if (!titulo || TEXTOS_DESCARTADOS.has(normalizarTextoBusqueda(titulo))) return;
        if (!esUrlHttpValida(href) || vistos.has(href)) return;
        vistos.add(href);
        articulos.push(normalizarArticuloDirecto({ titulo, resumen, contenido: resumen, url: href, fuente: fc.nombre, fechaPublicacion, imagen: resolverUrl(fc.url, imagen), categoriaSugerida: fc.categoria }));
    };

    $('article, .post, .jeg_post, .elementor-post, .news-item, li').each((_, nodo) => {
        const anchor = $(nodo).find('a[href]').first();
        const href = resolverUrl(fc.url, anchor.attr('href') || '');
        const titulo = limpiarContenidoFuente($(nodo).find('h1,h2,h3,h4,h5,h6').first().text() || anchor.text());
        const resumen = limpiarContenidoFuente($(nodo).find('p').first().text().trim());
        const fechaPublicacion = extraerFechaDesdeTexto($(nodo).find('time').first().attr('datetime')) || extraerFechaDesdeTexto($(nodo).find('time').first().text()) || extraerFechaDesdeTexto($(nodo).contents().first().text());
        const imagen = $(nodo).find('img').first().attr('src') || $(nodo).find('img').first().attr('data-src') || '';
        agregar(titulo, href, resumen, fechaPublicacion, imagen);
    });

    $('h1,h2,h3,h4,h5,h6').each((_, nodo) => {
        const heading = $(nodo);
        const titulo = limpiarContenidoFuente(heading.text());
        const anchor = heading.find('a[href]').first().length ? heading.find('a[href]').first() : heading.parent().find('a[href]').first();
        const href = resolverUrl(fc.url, anchor.attr('href') || '');
        const resumen = limpiarContenidoFuente(heading.parent().find('p').first().text() || heading.nextAll('p').first().text());
        const fechaPublicacion = extraerFechaDesdeTexto(heading.parent().find('time').first().attr('datetime')) || extraerFechaDesdeTexto(heading.parent().find('time').first().text()) || null;
        const imagen = heading.parent().find('img').first().attr('src') || heading.parent().find('img').first().attr('data-src') || '';
        agregar(titulo, href, resumen, fechaPublicacion, imagen);
    });

    return articulos;
}

// ── RSS parser liviano ──
function limpiarHtmlDeRss(texto = '') {
    return texto
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
        .replace(/\s+/g, ' ').trim();
}

function tieneContenidoSuficiente(articulo = {}) {
    const contenido = limpiarContenidoFuente(articulo.contenido || '');
    const resumen = limpiarContenidoFuente(articulo.resumen || '');

    if (!contenido) return false;
    if (contenido.length >= 280) return true;
    if (contenido.includes('\n\n')) return true;
    if (contenido !== resumen && contenido.length >= 180) return true;
    return false;
}

function extraerContenidoPrincipalDesdeHtml(html = '') {
    const desdeJsonLd = recolectarEntradasJsonLd(extraerObjetosJsonLd(html))
        .map((entrada) => limpiarContenidoFuente(entrada.articleBody || entrada.text || ''))
        .find((texto) => texto.length >= 220);

    if (desdeJsonLd) return desdeJsonLd;

    const $ = cheerio.load(html);
    const candidatos = [];

    $('article p, main p, .article-body p, .post-content p, .entry-content p, .content p').each((_, nodo) => {
        const texto = limpiarContenidoFuente($(nodo).text());
        if (texto.length >= 60 && !TEXTOS_DESCARTADOS.has(normalizarTextoBusqueda(texto))) {
            candidatos.push(texto);
        }
    });

    const unicos = [...new Set(candidatos)];
    const combinado = unicos.join(' ').trim();
    return combinado;
}

async function enriquecerArticuloDesdeUrl(articulo = {}) {
    if (!articulo?.url || !esUrlHttpValida(articulo.url) || tieneContenidoSuficiente(articulo)) {
        return articulo;
    }

    try {
        const html = await descargarHtml(articulo.url, 10000);
        const contenidoExtraido = limpiarContenidoFuente(extraerContenidoPrincipalDesdeHtml(html));
        if (!contenidoExtraido) return articulo;

        const contenido = contenidoExtraido.length <= 1600
            ? contenidoExtraido
            : `${contenidoExtraido.slice(0, 1597).trim()}...`;

        return normalizarArticuloDirecto({
            titulo: articulo.titulo,
            resumen: articulo.resumen,
            contenido,
            url: articulo.url,
            fuente: articulo.fuente,
            fechaPublicacion: articulo.fechaPublicacion,
            imagen: articulo.imagen,
            categoriaSugerida: articulo.categoriaSugerida,
        });
    } catch {
        return articulo;
    }
}

async function enriquecerArticulosConContenido(articulos = [], limite = 6) {
    const enriquecidos = [];
    let restantes = limite;

    for (const articulo of articulos) {
        if (restantes > 0 && !tieneContenidoSuficiente(articulo)) {
            enriquecidos.push(await enriquecerArticuloDesdeUrl(articulo));
            restantes -= 1;
            continue;
        }

        enriquecidos.push(articulo);
    }

    return enriquecidos;
}

function extraerArticulosDesdeRss(xmlText, fc) {
    const $ = cheerio.load(xmlText, { xmlMode: true });
    const articulos = [];

    $('item').each((_, item) => {
        const titulo = limpiarHtmlDeRss($('title', item).first().text());
        const urlRaw = $('link', item).first().text().trim() || $('guid', item).first().text().trim() || '';
        const url = urlRaw.startsWith('http') ? urlRaw : resolverUrl(fc.url, urlRaw);
        const resumen = limpiarHtmlDeRss(
            $('description', item).first().text() || $('content\\:encoded', item).first().text() || ''
        ).slice(0, 400);
        const fechaTexto = $('pubDate', item).first().text().trim() || $('dc\\:date', item).first().text().trim() || '';
        const fechaPublicacion = extraerFechaDesdeTexto(fechaTexto);
        const imagen = $('media\\:content', item).first().attr('url') || $('media\\:thumbnail', item).first().attr('url') || $('enclosure', item).first().attr('url') || '';
        if (!titulo || !esUrlHttpValida(url)) return;
        articulos.push(normalizarArticuloDirecto({ titulo, resumen, contenido: resumen, url, fuente: fc.nombre, fechaPublicacion, imagen, categoriaSugerida: fc.categoria }));
    });

    return articulos;
}

function filtrarPorFecha(articulos = [], fromDate) {
    const min = new Date(fromDate).getTime();
    return articulos.filter((a) => {
        const f = new Date(a.fechaPublicacion || '').getTime();
        return !Number.isNaN(f) && f >= min;
    });
}

async function descargarHtml(url, timeoutMs = FETCH_TIMEOUT_MS_DEFAULT) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'user-agent': 'Mozilla/5.0 (compatible; CoffePrice-Bot/1.0)',
                'accept': 'text/html,application/xhtml+xml,application/xml,application/rss+xml;q=0.9,*/*;q=0.8',
                'accept-language': 'es-CO,es;q=0.9,en;q=0.8',
                'cache-control': 'no-cache',
            },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
    } finally {
        clearTimeout(timer);
    }
}

async function obtenerDesdeFuenteDirecta(fc, fromDate) {
    const timeoutMs = fc.timeoutMs || FETCH_TIMEOUT_MS_DEFAULT;
    try {
        const html = await descargarHtml(fc.url, timeoutMs);
        const combinados = deduplicarArticulos([...extraerArticulosDesdeJsonLd(html, fc), ...extraerArticulosDesdeDOM(html, fc)]);
        const filtrados = filtrarPorFecha(combinados, fromDate);
        if (filtrados.length > 0) console.log(`[FuentesNoticias] ${fc.nombre}: ${filtrados.length} artículo(s)`);
        return filtrados;
    } catch (error) {
        const razon = error.name === 'AbortError' ? `timeout (>${timeoutMs / 1000}s)` : error.message;
        console.warn(`[FuentesNoticias] Fallo ${fc.nombre}: ${razon}`);
        return [];
    }
}

async function obtenerDesdeRss(fc, fromDate) {
    try {
        const xml = await descargarHtml(fc.url, 10000);
        const filtrados = filtrarPorFecha(extraerArticulosDesdeRss(xml, fc), fromDate);
        if (filtrados.length > 0) console.log(`[FuentesNoticias] RSS ${fc.nombre}: ${filtrados.length} artículo(s)`);
        return filtrados;
    } catch (error) {
        const razon = error.name === 'AbortError' ? 'timeout (>10s)' : error.message;
        console.warn(`[FuentesNoticias] RSS fallo ${fc.nombre}: ${razon}`);
        return [];
    }
}

async function obtenerArticulosFuentesDirectas(fromDate) {
    const [html, rss] = await Promise.all([
        Promise.all(FUENTES_DIRECTAS.map((fc) => obtenerDesdeFuenteDirecta(fc, fromDate))),
        Promise.all(FUENTES_RSS.map((fc) => obtenerDesdeRss(fc, fromDate))),
    ]);
    const combinados = [...html.flat(), ...rss.flat()];
    return enriquecerArticulosConContenido(combinados, 8);
}

async function buscarEnTheNewsApi(query, fromDate, estado) {
    if (!process.env.THENEWSAPI_TOKEN || estado.theNewsApiBloqueada) return [];
    const params = new URLSearchParams({ api_token: process.env.THENEWSAPI_TOKEN, search: query, language: 'es', sort: 'published_at', limit: '4' });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let res;
    try { res = await fetch(`https://api.thenewsapi.com/v1/news/all?${params}`, { signal: controller.signal }); }
    catch (err) { throw new Error(`TheNewsAPI fetch error: ${err.message}`); }
    finally { clearTimeout(timer); }
    if (!res.ok) {
        if ([402, 403, 429].includes(res.status)) { estado.theNewsApiBloqueada = true; console.warn(`[FuentesNoticias] TheNewsAPI bloqueada (${res.status})`); return []; }
        throw new Error(`TheNewsAPI ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    const min = new Date(fromDate).getTime();
    return (Array.isArray(data.data) ? data.data : []).filter((a) => { const f = new Date(a.published_at).getTime(); return !Number.isNaN(f) && f >= min; });
}

function mapearTheNewsApi(raw = {}, categoria) {
    return normalizarArticulo({ title: raw.title, description: raw.description || raw.snippet || '', content: raw.snippet || raw.description || '', url: raw.url, publishedAt: raw.published_at, urlToImage: raw.image_url, source: { name: raw.source || raw.source_name || 'The News API' } }, categoria);
}

async function buscarEnNewsdata(query, fromDate, estado) {
    if (!process.env.NEWSDATA_API_KEY || estado.newsdataBloqueada) return [];
    const params = new URLSearchParams({ apikey: process.env.NEWSDATA_API_KEY, q: query, language: 'es' });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let res;
    try { res = await fetch(`https://newsdata.io/api/1/news?${params}`, { signal: controller.signal }); }
    catch (err) { throw new Error(`newsdata.io fetch error: ${err.message}`); }
    finally { clearTimeout(timer); }
    if (!res.ok) {
        if ([401, 403, 429].includes(res.status)) { estado.newsdataBloqueada = true; console.warn(`[FuentesNoticias] newsdata.io bloqueada (${res.status})`); return []; }
        throw new Error(`newsdata.io ${res.status}`);
    }
    const data = await res.json();
    if (data.status !== 'success') return [];
    const min = new Date(fromDate).getTime();
    return (Array.isArray(data.results) ? data.results : []).filter((a) => { const f = new Date(a.pubDate).getTime(); return !Number.isNaN(f) && f >= min; });
}

function mapearNewsdata(raw = {}, categoria) {
    return normalizarArticulo({ title: raw.title, description: raw.description || raw.content || '', content: raw.content || raw.description || '', url: raw.link, publishedAt: raw.pubDate, urlToImage: raw.image_url, source: { name: raw.source_id || 'newsdata.io' } }, categoria);
}

async function buscarEnNewsApi(query, fromDate, estado) {
    if (!process.env.NEWSAPI_KEY || estado.newsApiBloqueada) return [];
    const params = new URLSearchParams({
        apiKey: process.env.NEWSAPI_KEY,
        q: query,
        language: 'es',
        sortBy: 'publishedAt',
        pageSize: '5',
        from: fromDate,
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let res;
    try { res = await fetch(`https://newsapi.org/v2/everything?${params}`, { signal: controller.signal }); }
    catch (err) { throw new Error(`NewsAPI fetch error: ${err.message}`); }
    finally { clearTimeout(timer); }
    if (!res.ok) {
        if ([401, 402, 403, 429].includes(res.status)) { estado.newsApiBloqueada = true; console.warn(`[FuentesNoticias] NewsAPI bloqueada (${res.status})`); return []; }
        throw new Error(`NewsAPI ${res.status}`);
    }
    const data = await res.json();
    if (data.status !== 'ok') return [];
    const min = new Date(fromDate).getTime();
    return (Array.isArray(data.articles) ? data.articles : []).filter((a) => {
        const f = new Date(a.publishedAt).getTime();
        return !Number.isNaN(f) && f >= min;
    });
}

function mapearNewsApi(raw = {}, categoria) {
    return normalizarArticulo({
        title: raw.title,
        description: raw.description || raw.content || '',
        content: raw.content || raw.description || '',
        url: raw.url,
        publishedAt: raw.publishedAt,
        urlToImage: raw.urlToImage,
        source: { name: raw.source?.name || 'NewsAPI' },
    }, categoria);
}

async function buscarEnGNews(query, fromDate, estado) {
    if (!process.env.GNEWS_API_KEY || estado.gnewsBloqueada) return [];
    const params = new URLSearchParams({
        apikey: process.env.GNEWS_API_KEY,
        q: query,
        lang: 'es',
        country: 'co',
        max: '5',
        from: fromDate,
        sortby: 'publishedAt',
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let res;
    try { res = await fetch(`https://gnews.io/api/v4/search?${params}`, { signal: controller.signal }); }
    catch (err) { throw new Error(`GNews fetch error: ${err.message}`); }
    finally { clearTimeout(timer); }
    if (!res.ok) {
        if ([401, 402, 403, 429].includes(res.status)) { estado.gnewsBloqueada = true; console.warn(`[FuentesNoticias] GNews bloqueada (${res.status})`); return []; }
        throw new Error(`GNews ${res.status}`);
    }
    const data = await res.json();
    const min = new Date(fromDate).getTime();
    return (Array.isArray(data.articles) ? data.articles : []).filter((a) => {
        const f = new Date(a.publishedAt).getTime();
        return !Number.isNaN(f) && f >= min;
    });
}

function mapearGNews(raw = {}, categoria) {
    return normalizarArticulo({
        title: raw.title,
        description: raw.description || raw.content || '',
        content: raw.content || raw.description || '',
        url: raw.url,
        publishedAt: raw.publishedAt,
        urlToImage: raw.image,
        source: { name: raw.source?.name || 'GNews' },
    }, categoria);
}

async function obtenerArticulosAgregador(fromDate, objetivoResultados) {
    const estado = {
        theNewsApiBloqueada: false,
        newsdataBloqueada: false,
        newsApiBloqueada: false,
        gnewsBloqueada: false,
    };
    const acumulados = [];

    for (const consulta of CONSULTAS_THE_NEWS_API) {
        if (estado.theNewsApiBloqueada) break;
        try { acumulados.push(...(await buscarEnTheNewsApi(consulta.query, fromDate, estado)).map((r) => mapearTheNewsApi(r, consulta.categoria))); }
        catch (e) { console.warn(`[FuentesNoticias] TheNewsAPI fallo "${consulta.query}": ${e.message}`); }
        if (deduplicarArticulos(filtrarArticulosValidos(acumulados)).length >= objetivoResultados) break;
    }

    if (deduplicarArticulos(filtrarArticulosValidos(acumulados)).length < objetivoResultados && process.env.NEWSDATA_API_KEY) {
        console.log('[FuentesNoticias] Intentando newsdata.io como respaldo...');
        for (const consulta of CONSULTAS_NEWSDATA) {
            if (estado.newsdataBloqueada) break;
            try { acumulados.push(...(await buscarEnNewsdata(consulta.query, fromDate, estado)).map((r) => mapearNewsdata(r, consulta.categoria))); }
            catch (e) { console.warn(`[FuentesNoticias] newsdata.io fallo "${consulta.query}": ${e.message}`); }
            if (deduplicarArticulos(filtrarArticulosValidos(acumulados)).length >= objetivoResultados) break;
        }
    }

    if (deduplicarArticulos(filtrarArticulosValidos(acumulados)).length < objetivoResultados && process.env.NEWSAPI_KEY) {
        console.log('[FuentesNoticias] Intentando NewsAPI como respaldo...');
        for (const consulta of CONSULTAS_NEWSAPI) {
            if (estado.newsApiBloqueada) break;
            try { acumulados.push(...(await buscarEnNewsApi(consulta.query, fromDate, estado)).map((r) => mapearNewsApi(r, consulta.categoria))); }
            catch (e) { console.warn(`[FuentesNoticias] NewsAPI fallo "${consulta.query}": ${e.message}`); }
            if (deduplicarArticulos(filtrarArticulosValidos(acumulados)).length >= objetivoResultados) break;
        }
    }

    if (deduplicarArticulos(filtrarArticulosValidos(acumulados)).length < objetivoResultados && process.env.GNEWS_API_KEY) {
        console.log('[FuentesNoticias] Intentando GNews como respaldo...');
        for (const consulta of CONSULTAS_GNEWS) {
            if (estado.gnewsBloqueada) break;
            try { acumulados.push(...(await buscarEnGNews(consulta.query, fromDate, estado)).map((r) => mapearGNews(r, consulta.categoria))); }
            catch (e) { console.warn(`[FuentesNoticias] GNews fallo "${consulta.query}": ${e.message}`); }
            if (deduplicarArticulos(filtrarArticulosValidos(acumulados)).length >= objetivoResultados) break;
        }
    }

    return acumulados;
}

export async function obtenerArticulosReales() {
    const ventanas = obtenerVentanasBusqueda();
    const minimoResultados = parseInt(process.env.NOTICIAS_MIN_ARTICULOS_FUENTE || '1', 10);
    const maximoResultados = parseInt(process.env.NOTICIAS_MAX_ARTICULOS_FUENTE || '12', 10);
    const minimoSoloDirectas = Math.max(3, Math.min(maximoResultados, minimoResultados + 2));
    const objetivoCandidatos = Math.max(maximoResultados, parseInt(process.env.NOTICIAS_OBJETIVO_CANDIDATAS || '8', 10));
    let acumuladosVentanas = [];

    for (const horas of ventanas) {
        const fromDate = obtenerFechaDesdeHorasAtras(horas);
        console.log(`[FuentesNoticias] Buscando últimas ${horas}h...`);

        const directos = await obtenerArticulosFuentesDirectas(fromDate);
        const directosValidos = deduplicarArticulos(filtrarArticulosValidos(directos));

        if (directosValidos.length >= minimoSoloDirectas) {
            console.log(`[FuentesNoticias] OK con fuentes directas: ${directosValidos.length} artículos`);
            acumuladosVentanas = deduplicarArticulos(filtrarArticulosValidos([...acumuladosVentanas, ...directosValidos]));
        }

        if (directosValidos.length > 0) {
            console.log(`[FuentesNoticias] Fuentes directas insuficientes (${directosValidos.length}). Buscando respaldo en agregadores...`);
        }

        const agregados = await obtenerArticulosAgregador(fromDate, objetivoCandidatos);
        const combinados = deduplicarArticulos(filtrarArticulosValidos([...directos, ...agregados]));
        acumuladosVentanas = deduplicarArticulos(filtrarArticulosValidos([...acumuladosVentanas, ...combinados]));

        if (combinados.length > 0) {
            console.log(`[FuentesNoticias] Combinados: ${combinados.length} artículos`);
            console.log(`[FuentesNoticias] Candidatos acumulados parciales: ${acumuladosVentanas.length}`);
        }

        console.log(`[FuentesNoticias] Acumulados tras ${horas}h: ${acumuladosVentanas.length}. Ampliando ventana...`);
    }

    console.warn('[FuentesNoticias] No se encontraron artículos en ninguna ventana.');
    if (acumuladosVentanas.length > 0) {
        console.log(`[FuentesNoticias] Devolviendo candidatos acumulados: ${acumuladosVentanas.length}`);
        return ordenarPorRelevanciaYFecha(acumuladosVentanas).slice(0, maximoResultados);
    }
    return [];
}

export { crearHashFuente, filtrarArticulosValidos, normalizarArticulo, obtenerVentanasBusqueda, obtenerDominio, obtenerFechaDesdeHorasAtras, ordenarPorRelevanciaYFecha };
