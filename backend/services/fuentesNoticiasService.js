import crypto from 'crypto';

function obtenerDominio(url = '') {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return '';
    }
}

function normalizarTextoBase(texto = '') {
    return texto
        .replace(/\s+/g, ' ')
        .trim();
}

function esUrlHttpValida(valor = '') {
    try {
        const url = new URL(valor);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function limpiarContenidoFuente(texto = '') {
    return normalizarTextoBase(texto)
        .replace(/\[\+\d+\s+chars\]$/i, '')
        .replace(/\[removed\]/gi, '')
        .trim();
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

    return {
        titulo,
        resumen,
        contenido,
        url,
        fuente,
        dominioFuente,
        fechaPublicacion,
        imagen,
        categoriaSugerida,
    };
}

function construirConsultasNoticias() {
    return [
        {
            categoria: 'el_pital',
            consultas: [
                '"El Pital" OR Huila OR "sur del Huila" OR caficultores huila',
                'Huila cafe OR caficultores huila OR "precio del cafe huila"',
            ],
        },
        {
            categoria: 'fnc',
            consultas: [
                '"Federacion Nacional de Cafeteros" OR Fedecafe OR caficultores colombia',
                '"comite de cafeteros" OR "caficultura colombiana"',
            ],
        },
        {
            categoria: 'mercado',
            consultas: [
                '"precio del cafe" OR "mercado del cafe" OR "cafe colombiano" OR "cafe huila"',
                '"precio cafe colombia" OR "venta de cafe" OR "compra de cafe"',
            ],
        },
        {
            categoria: 'clima',
            consultas: [
                'clima cafe OR lluvia cafe OR sequia cafe OR cosecha cafe',
                '"clima en zonas cafeteras" OR "lluvias en cultivos de cafe"',
            ],
        },
        {
            categoria: 'internacional',
            consultas: [
                '"exportaciones de cafe" OR "demanda de cafe" OR "mercado internacional del cafe"',
                '"precio internacional del cafe" OR "bolsa del cafe"',
            ],
        },
    ];
}

function obtenerFechaDesdeHorasAtras(horas = 8) {
    return new Date(Date.now() - horas * 60 * 60 * 1000).toISOString();
}

function obtenerVentanasBusqueda() {
    const base = parseInt(process.env.NOTICIAS_MAX_HORAS_FUENTE || '8');
    const ventanas = [base, 24, 48];
    return [...new Set(ventanas.filter((horas) => Number.isFinite(horas) && horas > 0))].sort((a, b) => a - b);
}

async function buscarEnNewsAPI(query, fromDate) {
    if (!process.env.NEWSAPI_KEY) {
        console.warn('[FuentesNoticias] NEWSAPI_KEY no configurada.');
        return [];
    }

    const params = new URLSearchParams({
        q: query,
        from: fromDate,
        sortBy: 'publishedAt',
        pageSize: '10',
        language: 'es',
        searchIn: 'title,description',
        apiKey: process.env.NEWSAPI_KEY,
    });

    const url = `https://newsapi.org/v2/everything?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
        const detalle = await res.text();
        throw new Error(`NewsAPI ${res.status}: ${detalle}`);
    }

    const data = await res.json();
    return Array.isArray(data.articles) ? data.articles : [];
}
async function buscarEnGNews(query, fromDate) {
    if (!process.env.GNEWS_API_KEY) return [];
    const params = new URLSearchParams({
        q: query, from: fromDate, sortby: "publishedAt",
        max: "10", lang: "es", apikey: process.env.GNEWS_API_KEY
    });
    try {
        const res = await fetch(`https://gnews.io/api/v4/search?${params}`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.articles || []).map(art => ({
            title: art.title, description: art.description,
            content: art.content, url: art.url,
            urlToImage: art.image, publishedAt: art.publishedAt,
            source: { name: art.source?.name || "GNews" },
        }));
    } catch { return []; }
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

    for (const articulo of articulos) {
        const hash = crearHashFuente(articulo);
        if (!hash || vistos.has(hash)) continue;
        vistos.add(hash);
        unicos.push({ ...articulo, sourceHash: hash });
    }

    return unicos;
}

function esArticuloUtil(articulo = {}) {
    const titulo = (articulo.titulo || '').toLowerCase();
    const resumen = (articulo.resumen || '').toLowerCase();
    const contenido = (articulo.contenido || '').toLowerCase();
    const texto = `${titulo} ${resumen} ${contenido}`.trim();

    if (!esUrlHttpValida(articulo.url)) return false;
    if (!titulo || titulo.length < 18) return false;
    if (!articulo.fechaPublicacion) return false;
    if (texto.includes('[removed]')) return false;
    if (texto.includes('removed')) return false;
    if (titulo === '[removed]') return false;
    if (titulo.includes('suscríbete') || titulo.includes('suscribete')) return false;
    if (titulo.includes('newsletter')) return false;
    if (articulo.dominioFuente.includes('youtube.com')) return false;
    if (articulo.dominioFuente.includes('youtu.be')) return false;

    return true;
}

function filtrarArticulosValidos(articulos = []) {
    return articulos.filter((articulo) =>
        esArticuloUtil(articulo)
    );
}

function puntuarArticulo(articulo = {}) {
    const texto = `${articulo.titulo || ''} ${articulo.resumen || ''} ${articulo.contenido || ''}`.toLowerCase();
    let puntaje = 0;

    if (texto.includes('huila')) puntaje += 5;
    if (texto.includes('el pital')) puntaje += 6;
    if (texto.includes('colombia')) puntaje += 3;
    if (texto.includes('caficult')) puntaje += 2;
    if (texto.includes('federacion nacional de cafeteros')) puntaje += 4;
    if (texto.includes('precio del cafe')) puntaje += 3;

    const antiguedadHoras = Math.max(
        0,
        (Date.now() - new Date(articulo.fechaPublicacion).getTime()) / (1000 * 60 * 60)
    );
    puntaje += Math.max(0, 6 - Math.min(6, antiguedadHoras)) / 2;

    return puntaje;
}

function ordenarPorRelevanciaYFecha(articulos = []) {
    return [...articulos].sort((a, b) => {
        const puntaje = puntuarArticulo(b) - puntuarArticulo(a);
        if (puntaje !== 0) return puntaje;
        return new Date(b.fechaPublicacion).getTime() - new Date(a.fechaPublicacion).getTime();
    });
}

export async function obtenerArticulosReales() {
    const consultas = construirConsultasNoticias();
    const ventanas = obtenerVentanasBusqueda();
    const minimoResultados = parseInt(process.env.NOTICIAS_MIN_ARTICULOS_FUENTE || '8');
    const maximoResultados = parseInt(process.env.NOTICIAS_MAX_ARTICULOS_FUENTE || '30');
    const acumulados = [];

    for (const horas of ventanas) {
        const fromDate = obtenerFechaDesdeHorasAtras(horas);
        const resultados = await Promise.allSettled(
            consultas.flatMap(({ categoria, consultas: consultasCategoria }) =>
                consultasCategoria.map(async (query) => {
                    let articulos = await buscarEnNewsAPI(query, fromDate);
                    if (articulos.length < 3) {
                        const deGNews = await buscarEnGNews(query, fromDate);
                        articulos = [...articulos, ...deGNews];
                    }
                    return articulos.map((raw) => normalizarArticulo(raw, categoria));
                })
            )
        );

        const articulosVentana = resultados.flatMap((resultado) => {
            if (resultado.status !== 'fulfilled') {
                console.error('[FuentesNoticias] Error consultando fuente:', resultado.reason?.message || resultado.reason);
                return [];
            }
            return resultado.value;
        });

        acumulados.push(...articulosVentana);

        const deduplicados = deduplicarArticulos(filtrarArticulosValidos(acumulados));
        if (deduplicados.length >= minimoResultados) {
            return ordenarPorRelevanciaYFecha(deduplicados).slice(0, maximoResultados);
        }
    }

    return ordenarPorRelevanciaYFecha(
        deduplicarArticulos(filtrarArticulosValidos(acumulados))
    ).slice(0, maximoResultados);
}

export {
    buscarEnNewsAPI,
    buscarEnGNews,
    construirConsultasNoticias,
    crearHashFuente,
    filtrarArticulosValidos,
    normalizarArticulo,
    obtenerVentanasBusqueda,
    obtenerDominio,
    obtenerFechaDesdeHorasAtras,
    ordenarPorRelevanciaYFecha,
};
