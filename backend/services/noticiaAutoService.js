import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import mongoose from 'mongoose';
import Noticia from '../models/noticia.js';
import NoticiaFuenteHistorial from '../models/noticiaFuenteHistorial.js';
import PrecioModel from '../models/precio.js';
import { crearHashFuente, obtenerArticulosReales } from './fuentesNoticiasService.js';

let generacionEnCurso = null;
let openaiClient = null;
let ultimaRevisionAutomaticaMs = 0;

function obtenerPartesBogota(fecha = new Date()) {
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(fecha);

    const mapa = Object.fromEntries(
        partes
            .filter((parte) => parte.type !== 'literal')
            .map((parte) => [parte.type, parte.value])
    );

    return {
        year: Number(mapa.year),
        month: Number(mapa.month),
        day: Number(mapa.day),
        hour: Number(mapa.hour),
        minute: Number(mapa.minute),
        dateKey: `${mapa.year}-${mapa.month}-${mapa.day}`,
    };
}

function obtenerSlotGeneracion(fecha = new Date()) {
    const { hour } = obtenerPartesBogota(fecha);
    if (hour >= 18) return 18;
    if (hour >= 12) return 12;
    if (hour >= 6) return 6;
    return 0;
}

function desplazarFechaLocal(dateKey, diasDelta) {
    const [year, month, day] = dateKey.split('-').map(Number);
    const baseUtc = new Date(Date.UTC(year, month - 1, day));
    baseUtc.setUTCDate(baseUtc.getUTCDate() + diasDelta);
    const yyyy = baseUtc.getUTCFullYear();
    const mm = String(baseUtc.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(baseUtc.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

async function asegurarConexionMongo() {
    if (mongoose.connection.readyState === 1) return;
    await mongoose.connection.asPromise();
}

const IMAGENES = {
    mercado: 'https://images.unsplash.com/photo-1611174743420-3d7df880ce32?w=800',
    clima: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800',
    consejos: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    fnc: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800',
    produccion: 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=800',
    internacional: 'https://images.unsplash.com/photo-1524350876685-274059332603?w=800',
    el_pital: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=800',
};

const CATEGORIAS_VALIDAS = ['mercado', 'clima', 'consejos', 'fnc', 'produccion', 'internacional', 'el_pital'];
const STOPWORDS = new Set([
    'para', 'como', 'esta', 'este', 'estos', 'estas', 'desde', 'hasta', 'sobre',
    'entre', 'tras', 'porque', 'donde', 'cuando', 'hacia', 'segun', 'aunque',
    'cafe', 'huila', 'pital', 'coffeprice', 'colombia', 'colombiano', 'colombiana',
    'ayer', 'hoy', 'manana', 'noche', 'tarde', 'madrugada', 'zona', 'sector', 'dia',
    'del', 'las', 'los', 'una', 'unas', 'unos', 'por', 'con', 'sin', 'que', 'sus',
    'mas', 'muy', 'pero', 'cada', 'ese', 'esa', 'aqui', 'alli', 'real',
    // Inglés — stopwords frecuentes en fuentes especializadas (NUEVO)
]);

const TITULOS_GENERICOS = [
    'panorama del cafe',
    'actualidad cafetera',
    'noticias del cafe',
    'mercado del cafe',
    'panorama cafetero',
    'situacion del cafe',
    'asi amanece el cafe',
    'asi se mueve el cafe',
    'resumen cafetero',
    'caficultura en contexto',
];

const PALABRAS_CAFE_RELEVANTES = [
    'cafe',
    'caficult',
    'cafetal',
    'cafetera',
    'cafetero',
    'grano',
    'pergamino',
    'federacion nacional de cafeteros',
    'comite de cafeteros',
    'fnc',
    'cosecha',
    'cultivo',
    'mercado del cafe',
    'precio del cafe',
    'venta de cafe',
    'compra de cafe',
    'exportaciones de cafe',
    'clima agricola',
    'zonas cafeteras',
    'carga de cafe',
    'grano de cafe',
    // Inglés (NUEVO)
];

const PALABRAS_RUIDO_RELEVANTES = [
    'sub 17',
    'sub17',
    'mundial',
    'conmebol',
    'futbol',
    'goleada',
    'penal',
    'jugador',
    'partido',
    'liga',
    'seleccion',
    'tenis',
    'baloncesto',
    'beisbol',
    'farandula',
    'celebridad',
    'novela',
    'actor',
    'serie',
    'asesinato',
    'capturado',
    'policia',
    'judicial',
    'accidente',
];

const PALABRAS_CONTEXTO_PRODUCTIVO_RELEVANTE = [
    'agro',
    'agricultura',
    'rural',
    'campo',
    'productor',
    'productores',
    'caficultor',
    'caficultores',
    'federacion',
    'cooperativa',
    'cosecha',
    'cultivo',
    'produccion',
    'fertilizantes',
    'huila',
    'el pital',
    'carga de cafe',
    'grano de cafe',
];

const PALABRAS_CONTEXTO_LOCAL_O_GREMIAL_RELEVANTE = [
    'huila',
    'el pital',
    'sur del huila',
    'federacion nacional de cafeteros',
    'comite de cafeteros',
    'federacion',
    'cooperativa cafetera',
];

// ── CORRECCIÓN PRINCIPAL: se amplía con señales en inglés ──
// Antes solo cubría español + 'coffee price'/'coffee market'.
// Las fuentes especializadas (Daily Coffee News, Sprudge, PDG) publican
// titulares como "Major Coffee Companies Join Initiative" o
// "New Green Coffee Equipment from World of Coffee" que son 100%
// relevantes pero no disparaban ninguna señal fuerte.
const PALABRAS_CAFE_FUERTES_AUTO = [
    // Español
    'precio del cafe',
    'mercado del cafe',
    'federacion nacional de cafeteros',
    'comite de cafeteros',
    'caficultores',
    'caficultura',
    'cultivo de cafe',
    'produccion de cafe',
    'cosecha de cafe',
    'exportaciones de cafe',
    'cafe colombiano',
    'bolsa del cafe',
    'sector cafetero',
    'precio de la carga',
    'carga de cafe',
    'grano de cafe',
    // Inglés — mercado y precios
    // Inglés — sector y actores
    // Inglés — producción y origen
    // Inglés — sostenibilidad y calidad
    // Inglés — publicaciones especializadas (señal de fuente confiable)
];

function contarFrasesEnTexto(texto = '', frases = []) {
    return frases.reduce((total, frase) => total + (texto.includes(frase) ? 1 : 0), 0);
}

function tieneContextoCafeFuerte(texto = '') {
    return contarFrasesEnTexto(normalizarTexto(texto), PALABRAS_CAFE_FUERTES_AUTO) >= 1;
}

// ── CORRECCIÓN: umbral Jaccard bajado de 0.28 a 0.15 para textos bilingües ──
// Cuando la fuente está en inglés y la adaptación en español, los tokens
// cambian completamente (distinto idioma). Con el umbral original de 0.28
// casi ningún artículo inglés-a-español lo pasaba. 0.15 sigue siendo
// suficiente para detectar divergencias temáticas reales (ej. un artículo
// de fútbol adaptado como noticia de café).
const UMBRAL_SIMILITUD_TEMATICA = 0.10;

function esTemaConsistenteConFuente(adaptada = {}, articulo = {}) {
    const fuente = normalizarTexto(`${articulo.titulo || ''} ${articulo.resumen || ''} ${articulo.contenido || ''}`);
    const publicada = normalizarTexto(`${adaptada.titulo || ''} ${adaptada.resumen || ''} ${adaptada.contenido || ''}`);

    if (!fuente || !publicada) return false;
    if (esTextoRuido(publicada)) return false;

    // Si la fuente tiene señal de café fuerte, confiar en la IA para la adaptación
    // y no rechazar solo por distancia lingüística entre idiomas
    if (tieneContextoCafeFuerte(fuente) && tieneContextoCafeFuerte(publicada)) return true;
    if (adaptada.titulo && articulo.titulo && normalizarTexto(adaptada.titulo) === normalizarTexto(articulo.titulo)) return true;

    const similitud = calcularSimilitud(obtenerTokens(publicada), obtenerTokens(fuente));
    return similitud >= UMBRAL_SIMILITUD_TEMATICA;
}

function normalizarTexto(texto = '') {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function contieneFrase(texto = '', frases = []) {
    return frases.some((frase) => texto.includes(frase));
}

function obtenerTokens(texto = '') {
    return normalizarTexto(texto)
        .split(' ')
        .filter((token) => token.length > 3 && !STOPWORDS.has(token));
}

function calcularSimilitud(tokensA = [], tokensB = []) {
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);

    if (!setA.size || !setB.size) return 0;

    let interseccion = 0;
    for (const token of setA) {
        if (setB.has(token)) interseccion++;
    }

    const union = new Set([...setA, ...setB]).size;
    return union ? interseccion / union : 0;
}

function limpiarTitulo(texto = '') {
    return texto
        .replace(/\s+/g, ' ')
        .replace(/\s+[:\-–|]+\s*$/g, '')
        .trim();
}

function capitalizarTitulo(texto = '') {
    const limpio = limpiarTitulo(texto);
    if (!limpio) return '';
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

function esTituloGenerico(titulo = '') {
    const normalizado = normalizarTexto(titulo);
    if (!normalizado) return true;
    if (normalizado.length < 18) return true;
    return TITULOS_GENERICOS.some((base) => normalizado.includes(base));
}

function resolverTituloFinal(tituloGenerado = '', tituloFuente = '') {
    const generado = capitalizarTitulo(tituloGenerado);
    const fuente = capitalizarTitulo(tituloFuente);

    if (fuente) return fuente;

    if (!generado) return fuente;
    if (!fuente) return generado;
    if (esTituloGenerico(generado)) return fuente;

    const similitud = calcularSimilitud(
        obtenerTokens(generado),
        obtenerTokens(fuente)
    );

    // CORRECCIÓN: umbral reducido a 0.25 para traducciones inglés→español
    // donde los tokens cambian de idioma y la similitud real baja aunque
    // el título sea semánticamente fiel.
    if (similitud < 0.25) return fuente;

    return generado;
}

function limpiarTextoAdaptado(texto = '') {
    return texto
        .replace(/\s+/g, ' ')
        .trim();
}

function dividirEnOraciones(texto = '') {
    const limpio = texto
        .replace(/\s+/g, ' ')
        .trim();

    if (!limpio) return [];

    return limpio
        .split(/(?<=[.!?])\s+/)
        .map((oracion) => oracion.trim())
        .filter(Boolean);
}

function agruparEnParrafos(oraciones = [], maxParrafos = 3) {
    if (!oraciones.length) return [];
    if (oraciones.length === 1) return oraciones;

    const totalParrafos = Math.min(maxParrafos, Math.max(2, oraciones.length >= 6 ? 3 : 2));
    const grupos = [];
    let inicio = 0;

    for (let i = 0; i < totalParrafos; i++) {
        const restantes = oraciones.length - inicio;
        const gruposRestantes = totalParrafos - i;
        const tamanoGrupo = Math.ceil(restantes / gruposRestantes);
        const bloque = oraciones.slice(inicio, inicio + tamanoGrupo).join(' ').trim();

        if (bloque) grupos.push(bloque);
        inicio += tamanoGrupo;
    }

    return grupos;
}

function normalizarContenidoEnParrafos(texto = '', maxParrafos = 3) {
    const original = (texto || '').trim();
    if (!original) return '';

    const bloques = original
        .split(/\n\s*\n/)
        .map((bloque) => bloque.replace(/\s+/g, ' ').trim())
        .filter(Boolean);

    if (bloques.length >= 2) {
        return bloques.slice(0, maxParrafos).join('\n\n');
    }

    const parrafos = agruparEnParrafos(dividirEnOraciones(original), maxParrafos);
    if (parrafos.length) return parrafos.join('\n\n');

    return limpiarTextoAdaptado(original);
}

function recortarTexto(texto = '', maximo = 220) {
    const limpio = limpiarTextoAdaptado(texto);
    if (!limpio) return '';
    if (limpio.length <= maximo) return limpio;
    return `${limpio.slice(0, Math.max(0, maximo - 3)).trim()}...`;
}

function construirContenidoLiteral(articulo = {}) {
    const partes = [
        limpiarTextoAdaptado(articulo.resumen || ''),
        limpiarTextoAdaptado(articulo.contenido || ''),
    ].filter(Boolean);

    if (!partes.length) return '';

    const unicas = [...new Set(partes)];
    const base = unicas.join('\n\n');
    const recortado = base.length <= 900 ? base : `${base.slice(0, 897).trim()}...`;
    return normalizarContenidoEnParrafos(recortado);
}

function construirAdaptacionLiteral(articulo = {}) {
    const titulo = capitalizarTitulo(articulo.titulo || '');
    const resumenBase = articulo.resumen || articulo.contenido || articulo.titulo || '';
    const contenido = construirContenidoLiteral(articulo);

    if (!titulo || !resumenBase || !contenido) return null;

    return {
        titulo: eliminarContextoForzado(titulo, articulo),
        resumen: eliminarContextoForzado(recortarTexto(resumenBase, 220), articulo),
        contenido: eliminarContextoForzado(contenido, articulo),
        categoria: (articulo.categoriaSugerida || 'mercado').toLowerCase().trim(),
        literal: true,
    };
}

function inferirCategoriaLocal(articulo = {}) {
    const texto = normalizarTexto(`${articulo.titulo || ''} ${articulo.resumen || ''} ${articulo.contenido || ''}`);
    if (texto.includes('el pital') || (texto.includes('huila') && texto.includes('caficult'))) return 'el_pital';
    if (texto.includes('federacion nacional de cafeteros') || texto.includes('comite de cafeteros')) return 'fnc';
    if (texto.includes('clima') || texto.includes('lluv') || texto.includes('sequ') || texto.includes('temperatura')) return 'clima';
    if (texto.includes('cosecha') || texto.includes('produccion') || texto.includes('cultivo') || texto.includes('fertilizantes')) return 'produccion';
    if (texto.includes('exportaciones') || texto.includes('internacional') || texto.includes('ico')) return 'internacional';
    return CATEGORIAS_VALIDAS.includes(articulo.categoriaSugerida) ? articulo.categoriaSugerida : 'mercado';
}

function adaptarArticuloLocalmente(articulo = {}) {
    const textoFuente = `${articulo.titulo || ''} ${articulo.resumen || ''} ${articulo.contenido || ''}`;
    if (esTextoRuido(textoFuente)) {
        return {
            descartar: true,
            motivo: 'La fuente pertenece a un tema claramente ruidoso o ajeno.',
        };
    }

    const titulo = eliminarContextoForzado(
        resolverTituloFinal(articulo.titulo?.trim(), articulo.titulo),
        articulo
    );
    const baseResumen = articulo.resumen || articulo.contenido || articulo.titulo || '';
    const contenidoBase = articulo.contenido || articulo.resumen || articulo.titulo || '';
    const resumen = eliminarContextoForzado(recortarTexto(baseResumen, 220), articulo);
    const contenido = eliminarContextoForzado(normalizarContenidoEnParrafos(contenidoBase), articulo);
    const categoria = inferirCategoriaLocal(articulo);

    if (!titulo || !resumen || !contenido) {
        return {
            descartar: true,
            motivo: 'No hubo suficiente contenido para resumir localmente.',
        };
    }

    return {
        titulo,
        resumen,
        contenido,
        categoria,
        literal: true,
        origenAdaptacion: 'local',
    };
}

function fuenteMencionaContextoLocal(articulo = {}) {
    const textoFuente = normalizarTexto(
        `${articulo.titulo || ''} ${articulo.resumen || ''} ${articulo.contenido || ''}`
    );

    return textoFuente.includes('el pital') || textoFuente.includes('pital') || textoFuente.includes('huila');
}

function eliminarContextoForzado(texto = '', articulo = {}) {
    const limpio = limpiarTextoAdaptado(texto);
    if (!limpio) return '';
    if (fuenteMencionaContextoLocal(articulo)) return limpio;

    return limpio
        .replace(/\b(en|desde|para|de)\s+El Pital,\s*Huila\b/gi, '')
        .replace(/\b(en|desde|para|de)\s+El Pital\b/gi, '')
        .replace(/\b(en|desde|para|de)\s+Huila\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/\s+([,.;:])/g, '$1')
        .trim();
}

function esAdaptacionForzada(adaptada = {}, articulo = {}) {
    if (fuenteMencionaContextoLocal(articulo)) return false;

    const textoAdaptado = normalizarTexto(
        `${adaptada.titulo || ''} ${adaptada.resumen || ''} ${adaptada.contenido || ''}`
    );

    if (!textoAdaptado) return false;

    return (
        textoAdaptado.includes('el pital') ||
        textoAdaptado.includes('pital') ||
        textoAdaptado.includes('caficultores de el pital')
    );
}

function esTextoCafeRelevante(texto = '') {
    return contieneFrase(normalizarTexto(texto), PALABRAS_CAFE_RELEVANTES);
}

function esTextoRuido(texto = '') {
    return contieneFrase(normalizarTexto(texto), PALABRAS_RUIDO_RELEVANTES);
}

function tieneContextoProductivoRelevante(texto = '') {
    return contieneFrase(normalizarTexto(texto), PALABRAS_CONTEXTO_PRODUCTIVO_RELEVANTE);
}

function permiteAdaptacionLiteral(articulo = {}) {
    const textoFuente = `${articulo.titulo || ''} ${articulo.resumen || ''} ${articulo.contenido || ''}`;
    return !esTextoRuido(textoFuente);
}

function evaluarNoticiaDanada(noticia = {}) {
    const razones = [];
    const textoFuente = `${noticia.sourceTitle || ''} ${noticia.fuente || ''} ${noticia.sourceDomain || ''}`;
    const textoPublico = `${noticia.titulo || ''} ${noticia.resumen || ''} ${noticia.contenido || ''}`;
    const resumenNormalizado = normalizarTexto(noticia.resumen || '');
    const contenidoNormalizado = normalizarTexto(noticia.contenido || '');

    if (esTextoRuido(textoFuente) || esTextoRuido(textoPublico)) {
        razones.push('tema_ajeno_al_cafe');
    }

    if (!fuenteMencionaContextoLocal({
        titulo: noticia.sourceTitle,
        resumen: '',
        contenido: '',
    }) && esAdaptacionForzada({
        titulo: noticia.titulo,
        resumen: noticia.resumen,
        contenido: noticia.contenido,
    }, {
        titulo: noticia.sourceTitle,
        resumen: '',
        contenido: '',
    })) {
        razones.push('contexto_local_forzado');
    }

    if (noticia.sourceTitle) {
        const similitudTitulo = calcularSimilitud(
            obtenerTokens(noticia.titulo || ''),
            obtenerTokens(noticia.sourceTitle || '')
        );

        if (similitudTitulo < 0.30) {
            razones.push('titulo_desalineado');
        }
    }

    if (!contenidoNormalizado || contenidoNormalizado.length < 120) {
        razones.push('contenido_insuficiente');
    }

    if (resumenNormalizado && contenidoNormalizado && resumenNormalizado === contenidoNormalizado) {
        razones.push('contenido_igual_al_resumen');
    }

    return [...new Set(razones)];
}

function prepararNoticiaParaComparacion(noticia = {}) {
    const titulo = noticia.titulo?.trim() || '';
    const resumen = noticia.resumen?.trim() || '';
    const contenido = noticia.contenido?.trim() || '';
    const categoria = (noticia.categoria || '').toLowerCase().trim();

    return {
        tituloNormalizado: normalizarTexto(titulo),
        resumenNormalizado: normalizarTexto(resumen),
        introNormalizada: normalizarTexto(contenido.slice(0, 260)),
        tokensTitulo: obtenerTokens(titulo),
        tokensResumen: obtenerTokens(resumen),
        tokensContenido: obtenerTokens(contenido.slice(0, 400)),
        categoria,
    };
}

function esNoticiaDuplicada(candidata, existente) {
    const actual = prepararNoticiaParaComparacion(candidata);
    const previa = prepararNoticiaParaComparacion(existente);

    if (!actual.tituloNormalizado || !previa.tituloNormalizado) return false;

    if (actual.tituloNormalizado === previa.tituloNormalizado) return true;
    if (actual.resumenNormalizado && actual.resumenNormalizado === previa.resumenNormalizado) return true;
    if (actual.introNormalizada && actual.introNormalizada === previa.introNormalizada) return true;

    const similitudTitulo = calcularSimilitud(actual.tokensTitulo, previa.tokensTitulo);
    const similitudResumen = calcularSimilitud(actual.tokensResumen, previa.tokensResumen);
    const similitudContenido = calcularSimilitud(actual.tokensContenido, previa.tokensContenido);
    const similitudCruce = calcularSimilitud(
        [...actual.tokensTitulo, ...actual.tokensResumen],
        [...previa.tokensTitulo, ...previa.tokensResumen]
    );

    if (similitudTitulo >= 0.75) return true;
    if (similitudResumen >= 0.82 && actual.categoria === previa.categoria) return true;
    if (similitudContenido >= 0.70 && actual.categoria === previa.categoria) return true;
    if (similitudCruce >= 0.68) return true;

    return false;
}

async function obtenerImagenDesdePaginaFuente(url = '') {
    if (!/^https?:\/\//i.test(url)) return '';

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'user-agent': 'Mozilla/5.0 (compatible; CoffePrice-Bot/1.0)',
                'accept-language': 'es-CO,es;q=0.9',
            },
        });
        clearTimeout(timer);

        if (!res.ok) return '';

        const html = await res.text();
        const $ = cheerio.load(html);
        const candidata =
            $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') ||
            $('article img').first().attr('src') ||
            $('img').first().attr('src') ||
            '';

        if (!candidata) return '';
        return new URL(candidata, url).toString();
    } catch {
        return '';
    }
}

async function seleccionarImagenNoticia(articulo, categoria) {
    if (articulo?.imagen && /^https?:\/\//i.test(articulo.imagen)) {
        return {
            imagen: articulo.imagen,
            tipoImagen: 'source',
            sourceImage: articulo.imagen,
        };
    }

    const imagenFuente = await obtenerImagenDesdePaginaFuente(articulo?.url || '');
    if (imagenFuente) {
        return {
            imagen: imagenFuente,
            tipoImagen: 'source',
            sourceImage: imagenFuente,
        };
    }

    return {
        imagen: IMAGENES[categoria] || IMAGENES.mercado,
        tipoImagen: 'fallback',
        sourceImage: null,
    };
}

async function obtenerNoticiasRecientes(horasRevision) {
    await asegurarConexionMongo();
    const fechaCorte = new Date(Date.now() - horasRevision * 60 * 60 * 1000);

    return Noticia.find({
        createdAt: { $gte: fechaCorte }
    })
        .sort({ createdAt: -1 })
        .limit(80)
        .select('titulo resumen contenido categoria sourceHash sourceUrl createdAt');
}

async function contarNoticiasAutoGeneradasRecientes(horas = 72) {
    await asegurarConexionMongo();
    const fechaCorte = new Date(Date.now() - horas * 60 * 60 * 1000);
    return Noticia.countDocuments({
        autoGenerada: true,
        createdAt: { $gte: fechaCorte },
    });
}

async function obtenerContexto() {
    await asegurarConexionMongo();
    const precios = await PrecioModel.find()
        .populate('comprador', 'nombreempresa direccion')
        .sort({ preciocarga: -1 })
        .limit(5);

    const mejorPrecio = precios[0]?.preciocarga || 0;
    const compradorTop = precios[0]?.comprador?.nombreempresa || 'sin datos';
    const precioPromedio = precios.length > 0
        ? Math.round(precios.reduce((suma, precio) => suma + precio.preciocarga, 0) / precios.length)
        : 0;

    let trm = 4100;
    try {
        const hoy = new Date().toISOString().split('T')[0];
        const res = await fetch(`https://www.datos.gov.co/resource/mcec-87by.json?vigenciadesde=${hoy}&$limit=1`);
        const data = await res.json();
        if (data[0]?.valor) trm = parseFloat(data[0].valor);
    } catch {
        // fallback
    }

    let climaTexto = 'condiciones normales';
    try {
        const res = await fetch(
            'https://api.open-meteo.com/v1/forecast?latitude=1.85&longitude=-76.05&current=temperature_2m,precipitation,weather_code,wind_speed_10m&timezone=America%2FBogota'
        );
        const data = await res.json();
        const cod = data.current.weather_code;
        const temperatura = data.current.temperature_2m;
        const lluvia = data.current.precipitation;

        let descripcion = 'Parcialmente nublado';
        if (cod === 0) descripcion = 'Cielo despejado';
        else if (cod <= 3) descripcion = 'Parcialmente nublado';
        else if (cod <= 48) descripcion = 'Nublado';
        else if (cod <= 67) descripcion = `lluvia (${lluvia}mm)`;
        else if (cod <= 82) descripcion = 'Aguacero';
        else descripcion = 'Tormenta electrica';

        climaTexto = `${descripcion}, ${temperatura}C`;
    } catch {
        // fallback
    }

    return { mejorPrecio, compradorTop, precioPromedio, trm, climaTexto };
}

// ── CORRECCIÓN: prompt reescrito para aceptar artículos en inglés del sector ──
// El prompt anterior tenía una instrucción contradictoria: decía "si no trata
// claramente de cafe" descartar, pero el ejemplo de lo que NO debía pasar
// mencionaba "futbol, farandula, judicial" — sin aclarar que artículos
// especializados en inglés SÍ son válidos. La IA los descartaba porque el
// artículo no usaba exactamente "cafe" en español. Ahora se explicita que
// cualquier tema del sector cafetero global (en cualquier idioma) es válido.
function construirPromptAdaptacion(articulo, ctx) {
    return `Eres editor periodistico de CoffePrice para usuarios del sector cafetero colombiano.

CONTEXTO LOCAL:
- Mejor precio local: $${ctx.mejorPrecio.toLocaleString()} COP por carga
- Comprador top: ${ctx.compradorTop}
- Precio promedio local: $${ctx.precioPromedio.toLocaleString()} COP por carga
- TRM: $${ctx.trm.toLocaleString()} COP por dolar
- Clima actual: ${ctx.climaTexto}

ARTICULO REAL A RESUMIR:
- Titulo original: ${articulo.titulo}
- Fuente: ${articulo.fuente} (${articulo.dominioFuente})
- Fecha publicacion: ${articulo.fechaPublicacion}
- Descripcion: ${articulo.resumen || 'Sin descripcion'}
- Contenido: ${articulo.contenido || 'Sin contenido'}
- Categoria sugerida: ${articulo.categoriaSugerida}
- URL: ${articulo.url}

REGLAS:
- Resume y adapta esta noticia sin cambiar su tema central
- No inventes hechos nuevos
- Si falta un dato, no lo rellenes
- Mantén el enfoque practico y claro
- Elige una sola categoria valida entre: mercado, clima, consejos, fnc, produccion, internacional, el_pital
- El titulo debe sonar natural en espanol colombiano
- El resumen debe tener maximo 220 caracteres
- El contenido debe tener 2 o 3 parrafos breves

Responde solo con JSON valido:
{
  "titulo": "titulo adaptado",
  "resumen": "resumen corto",
  "contenido": "contenido adaptado",
  "categoria": "categoria valida"
}`;
}

function construirPromptAdaptacionV2(articulo, ctx) {
    return `Eres editor periodistico de CoffePrice para usuarios del sector cafetero colombiano.

CONTEXTO LOCAL:
- Mejor precio local: $${ctx.mejorPrecio.toLocaleString()} COP por carga
- Comprador top: ${ctx.compradorTop}
- Precio promedio local: $${ctx.precioPromedio.toLocaleString()} COP por carga
- TRM: $${ctx.trm.toLocaleString()} COP por dolar
- Clima actual: ${ctx.climaTexto}

ARTICULO REAL A RESUMIR:
- Titulo original: ${articulo.titulo}
- Fuente: ${articulo.fuente} (${articulo.dominioFuente})
- Fecha publicacion: ${articulo.fechaPublicacion}
- Descripcion: ${articulo.resumen || 'Sin descripcion'}
- Contenido: ${articulo.contenido || 'Sin contenido'}
- Categoria sugerida: ${articulo.categoriaSugerida}
- URL: ${articulo.url}

TEMA VALIDO — el articulo pertenece al sector cafetero si trata de CUALQUIERA de estos temas:
- Cafe: cultivo, produccion, cosecha, exportaciones, precios, mercado, calidad, sostenibilidad
- Empresas, cooperativas o iniciativas del sector cafetero
- Tecnologia o innovacion aplicada al cafe
- Federacion Nacional de Cafeteros u organizaciones del gremio
- Clima o condiciones que afecten zonas productoras de cafe
- Cafe de origen y cafe especial
- Economia regional, agro, compradores, productores o noticias locales del Huila relacionadas con actividad productiva

El articulo debe venir de una fuente en espanol. Si el texto base esta en ingles o mezcla mas ingles que espanol, descartar=true.

DESCARTAR — solo si el articulo trata de:
- Futbol, deportes, farandula, entretenimiento
- Sucesos judiciales, politica partidista, accidentes o temas claramente ajenos al agro, la economia o la produccion

REGLAS OBLIGATORIAS:
- Resume fielmente esta noticia sin reinterpretarla.
- No inventes hechos nuevos.
- No agregues El Pital, Huila, caficultores locales o contexto regional si la fuente original no lo menciona.
- Conserva el sujeto principal del titular original.
- Si el titulo original ya es claro, manten practicamente ese mismo titulo.
- Elige una sola categoria valida entre: mercado, clima, consejos, fnc, produccion, internacional, el_pital
- El titulo debe sonar natural en espanol colombiano.
- El resumen debe tener maximo 220 caracteres.
- El contenido debe tener 2 o 3 parrafos breves.

Responde solo con JSON valido:
{
  "descartar": false,
  "motivo": "",
  "titulo": "titulo adaptado",
  "resumen": "resumen corto",
  "contenido": "contenido adaptado",
  "categoria": "categoria valida"
}`;
}

async function adaptarArticuloConIA(articulo, ctx) {
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    const prompt = construirPromptAdaptacionV2(articulo, ctx);

    const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: 'Eres un editor periodistico especializado en resumir noticias reales del sector cafetero en espanol. Tu prioridad es la fidelidad a la fuente, sin reinterpretar ni regionalizar. Respondes solo con JSON valido.'
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.2,
        max_tokens: 900,
        response_format: { type: 'json_object' },
    });

    const texto = completion.choices[0].message.content;
    const parsed = JSON.parse(texto);

    if (parsed.descartar) {
        const motivo = parsed.motivo?.trim() || 'Articulo no relacionado con el sector cafetero.';
        const esRuidoClaro = esTextoRuido(`${articulo.titulo || ''} ${articulo.resumen || ''} ${articulo.contenido || ''}`);

        if (!esRuidoClaro && permiteAdaptacionLiteral(articulo)) {
            const literal = construirAdaptacionLiteral(articulo);
            if (literal) {
                return literal;
            }
        }

        return {
            descartar: true,
            motivo,
        };
    }

    const adaptada = {
        titulo: eliminarContextoForzado(
            resolverTituloFinal(parsed.titulo?.trim(), articulo.titulo),
            articulo
        ),
        resumen: eliminarContextoForzado(parsed.resumen?.trim(), articulo),
        contenido: eliminarContextoForzado(
            normalizarContenidoEnParrafos(parsed.contenido?.trim()),
            articulo
        ),
        categoria: (parsed.categoria || articulo.categoriaSugerida || 'mercado').toLowerCase().trim(),
    };

    if (!adaptada.titulo || !adaptada.resumen || !adaptada.contenido) {
        return {
            descartar: true,
            motivo: 'La IA devolvio campos vacios.',
        };
    }

    if (!CATEGORIAS_VALIDAS.includes(adaptada.categoria)) {
        adaptada.categoria = CATEGORIAS_VALIDAS.includes(articulo.categoriaSugerida)
            ? articulo.categoriaSugerida
            : 'mercado';
    }

    if (esAdaptacionForzada(adaptada, articulo)) {
        return {
            descartar: true,
            motivo: 'La adaptacion agrego contexto local no presente en la fuente.',
        };
    }

    if (!esTemaConsistenteConFuente(adaptada, articulo)) {
        return {
            descartar: true,
            motivo: 'La adaptacion se alejo del tema original.',
        };
    }

    return adaptada;
}

async function existeFuenteGuardada(sourceHash, sourceUrl) {
    await asegurarConexionMongo();
    if (!sourceHash && !sourceUrl) return false;
    return Boolean(await Noticia.findOne({
        $or: [
            ...(sourceHash ? [{ sourceHash }] : []),
            ...(sourceUrl ? [{ sourceUrl }] : []),
        ]
    }).select('_id'));
}

async function fueFuenteUsadaRecientemente(sourceHash, horasBloqueo = 168) {
    await asegurarConexionMongo();
    if (!sourceHash) return false;
    const fechaCorte = new Date(Date.now() - horasBloqueo * 60 * 60 * 1000);
    return Boolean(await NoticiaFuenteHistorial.findOne({
        sourceHash,
        lastGeneratedAt: { $gte: fechaCorte },
        lastOutcome: 'generated',
    }).select('_id'));
}

async function registrarFuenteGenerada(sourceHash, articulo = {}) {
    await asegurarConexionMongo();
    if (!sourceHash) return;
    await NoticiaFuenteHistorial.findOneAndUpdate(
        { sourceHash },
        {
            sourceHash,
            sourceUrl: articulo.url || null,
            sourceTitle: articulo.titulo || null,
            lastGeneratedAt: new Date(),
            lastOutcome: 'generated',
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
}

async function sembrarHistorialDesdeNoticiasRecientes(horas = 168, limite = 40) {
    await asegurarConexionMongo();
    const fechaCorte = new Date(Date.now() - horas * 60 * 60 * 1000);
    const recientes = await Noticia.find({
        autoGenerada: true,
        sourceHash: { $exists: true, $ne: null },
        createdAt: { $gte: fechaCorte },
    })
        .sort({ createdAt: -1 })
        .limit(limite)
        .select('sourceHash sourceUrl sourceTitle createdAt');

    for (const noticia of recientes) {
        await NoticiaFuenteHistorial.findOneAndUpdate(
            { sourceHash: noticia.sourceHash },
            {
                sourceHash: noticia.sourceHash,
                sourceUrl: noticia.sourceUrl || null,
                sourceTitle: noticia.sourceTitle || null,
                lastGeneratedAt: noticia.createdAt || new Date(),
                lastOutcome: 'generated',
            },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
    }
}

export async function limpiarNoticiasPorVentana({
    referencia = new Date(),
    incluirRespaldoAntiguo = true,
} = {}) {
    await asegurarConexionMongo();

    const { dateKey } = obtenerPartesBogota(referencia);
    const ayer = desplazarFechaLocal(dateKey, -1);

    const filtroPrincipal = {
        autoGenerada: true,
        $or: [
            { generacionFechaLocal: ayer, generacionSlot: { $in: [6, 12, 18] } },
        ],
    };

    const resultadoPrincipal = await Noticia.deleteMany(filtroPrincipal);
    let eliminadas = resultadoPrincipal.deletedCount || 0;

    if (incluirRespaldoAntiguo) {
        const fechaCorte = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const respaldo = await Noticia.deleteMany({
            autoGenerada: true,
            createdAt: { $lt: fechaCorte },
        });
        eliminadas += respaldo.deletedCount || 0;
    }

    return eliminadas;
}

export async function limpiarNoticiasMedianoche({
    referencia = new Date(),
} = {}) {
    await asegurarConexionMongo();
    const { dateKey } = obtenerPartesBogota(referencia);
    const resultado = await Noticia.deleteMany({
        autoGenerada: true,
        generacionFechaLocal: dateKey,
        generacionSlot: 0,
    });
    return resultado.deletedCount || 0;
}

export async function generarNoticiasDelDia(opciones = {}) {
    await asegurarConexionMongo();
    const modoAdaptacion = (process.env.NOTICIAS_MODO_ADAPTACION || 'local').toLowerCase().trim();
    const referencia = opciones.referencia ? new Date(opciones.referencia) : new Date();
    const slotGeneracion = opciones.slotGeneracion ?? obtenerSlotGeneracion(referencia);
    const fechaLocalGeneracion = opciones.fechaLocalGeneracion || obtenerPartesBogota(referencia).dateKey;

    if (modoAdaptacion === 'ia' && !process.env.OPENAI_API_KEY) {
        console.warn('[NoticiaAuto] OPENAI_API_KEY no configurada.');
        return 0;
    }

    if (!process.env.THENEWSAPI_TOKEN) {
        console.log('[NoticiaAuto] Fuentes activas: fuentes directas y RSS en espanol.');
    } else {
        console.log('[NoticiaAuto] Fuentes activas: fuentes directas y RSS en espanol + agregadores en espanol.');
    }

    console.log('[NoticiaAuto] Iniciando ciclo de generacion con fuentes reales...');

    const maxNoticias = parseInt(process.env.NOTICIAS_POR_CICLO || '3');
    const horasRevisionDuplicados = parseInt(process.env.NOTICIAS_HORAS_REVISAR_DUPLICADOS || '48');
    const horasBloqueoRepetidas = parseInt(process.env.NOTICIAS_BLOQUEAR_REPETIDAS_HORAS || '168');

    try {
        await sembrarHistorialDesdeNoticiasRecientes(horasBloqueoRepetidas, 60);
    } catch (error) {
        console.warn('[NoticiaAuto] No se pudo sincronizar historial de fuentes:', error.message);
    }

    try {
        const limpieza = { eliminadas: 0 };
        /* const limpieza = await limpiarNoticiasDanadas({
            dryRun: false,
            soloAutoGeneradas: true,
            limite: 300,
        }); */
        if (limpieza.eliminadas > 0) {
            console.log(`[NoticiaAuto] Limpieza previa automatica: ${limpieza.eliminadas} noticias dañadas eliminadas`);
        }
    } catch (error) {
        console.warn('[NoticiaAuto] No se pudo ejecutar la limpieza previa automatica:', error.message);
    }

    const ctx = modoAdaptacion === 'ia' ? await obtenerContexto() : null;
    const noticiasRecientes = await obtenerNoticiasRecientes(horasRevisionDuplicados);

    let articulos = [];
    try {
        articulos = await obtenerArticulosReales();
    } catch (error) {
        console.error('[NoticiaAuto] Error obteniendo articulos reales:', error.message);
        return 0;
    }

    if (!articulos.length) {
        console.warn('[NoticiaAuto] No llegaron articulos recientes desde las fuentes.');
        return 0;
    }

    let creadas = 0;

    for (const articulo of articulos) {
        if (creadas >= maxNoticias) break;

        const sourceHash = articulo.sourceHash || crearHashFuente(articulo);
        const yaExisteFuente = await existeFuenteGuardada(sourceHash, articulo.url);
        if (yaExisteFuente) {
            console.log(`[NoticiaAuto] Fuente duplicada descartada: '${articulo.titulo}'`);
            continue;
        }

        const usadaRecientemente = await fueFuenteUsadaRecientemente(sourceHash, horasBloqueoRepetidas);
        if (usadaRecientemente) {
            console.log(`[NoticiaAuto] Fuente omitida por rotacion reciente: '${articulo.titulo}'`);
            continue;
        }

        let adaptada;
        try {
            adaptada = modoAdaptacion === 'ia'
                ? await adaptarArticuloConIA(articulo, ctx)
                : adaptarArticuloLocalmente(articulo);
        } catch (error) {
            console.error(`[NoticiaAuto] Error adaptando articulo '${articulo.titulo}':`, error.message);
            continue;
        }

        if (adaptada.descartar) {
            console.log(`[NoticiaAuto] Articulo descartado por relevancia: '${articulo.titulo}' -> ${adaptada.motivo || 'sin motivo'}`);
            continue;
        }

        if (!adaptada.titulo || !adaptada.resumen || !adaptada.contenido) {
            continue;
        }

        if (adaptada.literal) {
            console.log(`[NoticiaAuto] Usando adaptacion literal para: '${articulo.titulo}'`);
        }

        if (esTextoRuido(`${adaptada.titulo} ${adaptada.resumen} ${adaptada.contenido}`)) {
            console.log(`[NoticiaAuto] Adaptacion descartada por ruido tematico: '${articulo.titulo}'`);
            continue;
        }

        if (esAdaptacionForzada(adaptada, articulo)) {
            console.log(`[NoticiaAuto] Adaptacion forzada descartada: '${articulo.titulo}'`);
            continue;
        }

        adaptada.categoria = CATEGORIAS_VALIDAS.includes(adaptada.categoria)
            ? adaptada.categoria
            : (CATEGORIAS_VALIDAS.includes(articulo.categoriaSugerida) ? articulo.categoriaSugerida : 'mercado');

        const duplicadaPorTexto = noticiasRecientes.find((existente) => esNoticiaDuplicada(adaptada, existente));
        if (duplicadaPorTexto) {
            console.log(`[NoticiaAuto] Duplicado por contenido descartado: '${adaptada.titulo}' vs '${duplicadaPorTexto.titulo}'`);
            continue;
        }

        try {
            const imagenSeleccionada = await seleccionarImagenNoticia(articulo, adaptada.categoria);
            const nuevaNoticia = await Noticia.create({
                titulo: adaptada.titulo,
                resumen: adaptada.resumen,
                contenido: adaptada.contenido,
                categoria: adaptada.categoria,
                fuente: articulo.fuente || 'Fuente externa',
                imagen: imagenSeleccionada.imagen,
                sourceUrl: articulo.url,
                sourceTitle: articulo.titulo,
                sourceDomain: articulo.dominioFuente,
                sourceHash,
                sourceImage: imagenSeleccionada.sourceImage,
                publishedAt: articulo.fechaPublicacion ? new Date(articulo.fechaPublicacion) : null,
                tipoImagen: imagenSeleccionada.tipoImagen,
                autoGenerada: true,
                cicloGeneracion: 'fuentes_reales',
                generacionSlot: slotGeneracion,
                generacionFechaLocal: fechaLocalGeneracion,
            });

            await registrarFuenteGenerada(sourceHash, articulo);

            noticiasRecientes.unshift({
                titulo: nuevaNoticia.titulo,
                resumen: nuevaNoticia.resumen,
                contenido: nuevaNoticia.contenido,
                categoria: nuevaNoticia.categoria,
                sourceHash: nuevaNoticia.sourceHash,
                sourceUrl: nuevaNoticia.sourceUrl,
                createdAt: nuevaNoticia.createdAt,
            });

            creadas++;
            console.log(`[NoticiaAuto] Noticia creada desde fuente real: '${nuevaNoticia.titulo}'`);
        } catch (error) {
            if (error?.code === 11000) {
                console.log(`[NoticiaAuto] Fuente duplicada por indice unico: '${articulo.titulo}'`);
                continue;
            }
            console.error(`[NoticiaAuto] Error guardando noticia '${articulo.titulo}':`, error.message);
        }
    }

    console.log(`[NoticiaAuto] Ciclo finalizado. ${creadas} noticias nuevas.`);
    return creadas;
}

export async function asegurarNoticiasRecientes(opciones = {}) {
    const intervaloMinimoMs = parseInt(process.env.NOTICIAS_MIN_INTERVALO_REVISION_MS || '300000', 10);
    const ahora = Date.now();

    if (ahora - ultimaRevisionAutomaticaMs < intervaloMinimoMs) {
        return false;
    }
    ultimaRevisionAutomaticaMs = ahora;

    await asegurarConexionMongo();
    const {
        maxHorasSinNoticias = parseInt(process.env.NOTICIAS_MAX_HORAS_SIN_ACTUALIZAR || '8'),
        minNoticiasActivas = parseInt(process.env.NOTICIAS_MIN_ACTIVAS || '6'),
        horasVentanaInventario = parseInt(process.env.NOTICIAS_HORAS_INVENTARIO || '72'),
    } = opciones;

    const modoAdaptacion = (process.env.NOTICIAS_MODO_ADAPTACION || 'local').toLowerCase().trim();
    if (modoAdaptacion === 'ia' && !process.env.OPENAI_API_KEY) {
        console.warn('[NoticiaAuto] OPENAI_API_KEY no configurada. Se omite la actualizacion automatica.');
        return false;
    }

    const ultimaNoticia = await Noticia.findOne({ autoGenerada: true })
        .sort({ createdAt: -1 })
        .select('createdAt titulo');
    const noticiasActivas = await contarNoticiasAutoGeneradasRecientes(horasVentanaInventario);

    const limite = new Date(Date.now() - maxHorasSinNoticias * 60 * 60 * 1000);
    const necesitaActualizacionPorEdad = !ultimaNoticia || ultimaNoticia.createdAt < limite;
    const necesitaActualizacionPorInventario = noticiasActivas < minNoticiasActivas;
    const necesitaActualizacion = necesitaActualizacionPorEdad || necesitaActualizacionPorInventario;

    if (!necesitaActualizacion) return false;

    if (!generacionEnCurso) {
        const motivo = necesitaActualizacionPorInventario
            ? `inventario bajo (${noticiasActivas}/${minNoticiasActivas})`
            : 'noticias desactualizadas';
        console.log(`[NoticiaAuto] Refresco automatico activado por ${motivo}...`);
        generacionEnCurso = generarNoticiasDelDia()
            .catch((error) => {
                console.error('[NoticiaAuto] Error refrescando noticias:', error.message);
                return 0;
            })
            .finally(() => {
                generacionEnCurso = null;
            });
    } else {
        console.log('[NoticiaAuto] Esperando generacion de noticias ya iniciada...');
    }

    await generacionEnCurso;
    return true;
}

export async function limpiarNoticiasViejas() {
    await asegurarConexionMongo();
    const dias = parseInt(process.env.NOTICIAS_DIAS_CONSERVAR || '7');
    const fechaCorte = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

    const resultado = await Noticia.deleteMany({
        autoGenerada: true,
        createdAt: { $lt: fechaCorte }
    });

    if (resultado.deletedCount > 0) {
        console.log(`[NoticiaAuto] Limpieza: ${resultado.deletedCount} noticias viejas eliminadas`);
    }

    return resultado.deletedCount;
}

export async function limpiarNoticiasDanadas({
    dryRun = false,
    soloAutoGeneradas = true,
    limite = 100,
} = {}) {
    await asegurarConexionMongo();
    const filtro = soloAutoGeneradas ? { autoGenerada: true } : {};
    const noticias = await Noticia.find(filtro)
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(limite);

    const candidatas = noticias
        .map((noticia) => ({
            noticia,
            razones: evaluarNoticiaDanada(noticia),
        }))
        .filter(({ razones }) => razones.length > 0);

    if (dryRun) {
        return {
            eliminadas: 0,
            encontradas: candidatas.length,
            candidatas: candidatas.map(({ noticia, razones }) => ({
                _id: noticia._id,
                titulo: noticia.titulo,
                sourceTitle: noticia.sourceTitle,
                categoria: noticia.categoria,
                razones,
            })),
        };
    }

    const ids = candidatas.map(({ noticia }) => noticia._id);
    let eliminadas = 0;

    if (ids.length > 0) {
        const resultado = await Noticia.deleteMany({ _id: { $in: ids } });
        eliminadas = resultado.deletedCount || 0;
    }

    return {
        eliminadas,
        encontradas: candidatas.length,
        candidatas: candidatas.map(({ noticia, razones }) => ({
            _id: noticia._id,
            titulo: noticia.titulo,
            sourceTitle: noticia.sourceTitle,
            categoria: noticia.categoria,
            razones,
        })),
    };
}
