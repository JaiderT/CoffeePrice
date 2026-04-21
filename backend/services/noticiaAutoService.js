import OpenAI from 'openai';
import Noticia from '../models/noticia.js';
import PrecioModel from '../models/precio.js';
import { crearHashFuente, obtenerArticulosReales } from './fuentesNoticiasService.js';

let generacionEnCurso = null;
let openaiClient = null;

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
    'mas', 'muy', 'pero', 'cada', 'ese', 'esa', 'aqui', 'alli', 'real'
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

    if (!generado) return fuente;
    if (!fuente) return generado;
    if (esTituloGenerico(generado)) return fuente;

    const similitud = calcularSimilitud(
        obtenerTokens(generado),
        obtenerTokens(fuente)
    );

    if (similitud < 0.22) return fuente;

    return generado;
}

function limpiarTextoAdaptado(texto = '') {
    return texto
        .replace(/\s+/g, ' ')
        .trim();
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

function evaluarNoticiaDanada(noticia = {}) {
    const razones = [];
    const textoFuente = `${noticia.sourceTitle || ''} ${noticia.fuente || ''} ${noticia.sourceDomain || ''}`;
    const textoPublico = `${noticia.titulo || ''} ${noticia.resumen || ''} ${noticia.contenido || ''}`;

    if (esTextoRuido(textoFuente) || esTextoRuido(textoPublico)) {
        razones.push('tema_ajeno_al_cafe');
    }

    if (!esTextoCafeRelevante(textoFuente)) {
        razones.push('fuente_sin_relacion_cafetera');
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

        if (similitudTitulo < 0.16) {
            razones.push('titulo_desalineado');
        }
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

function seleccionarImagenNoticia(articulo, categoria) {
    if (articulo?.imagen && /^https?:\/\//i.test(articulo.imagen)) {
        return {
            imagen: articulo.imagen,
            tipoImagen: 'source',
            sourceImage: articulo.imagen,
        };
    }

    return {
        imagen: IMAGENES[categoria] || IMAGENES.mercado,
        tipoImagen: 'fallback',
        sourceImage: null,
    };
}

async function obtenerNoticiasRecientes(horasRevision) {
    const fechaCorte = new Date(Date.now() - horasRevision * 60 * 60 * 1000);

    return Noticia.find({
        createdAt: { $gte: fechaCorte }
    })
        .sort({ createdAt: -1 })
        .limit(80)
        .select('titulo resumen contenido categoria sourceHash sourceUrl createdAt');
}

async function obtenerContexto() {
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

REGLAS:
- Resume y adapta esta noticia sin cambiar su tema central
- No inventes hechos nuevos
- Si falta un dato, no lo rellenes
- Manten el enfoque practico y claro
- No conviertas una noticia general en una noticia de El Pital, Huila o caficultores si la fuente no lo menciona
- No cambies deportes, farandula, judicial o politica general para hacerlos parecer noticias del cafe
- Si la noticia no trata realmente sobre cafe, caficultura, clima agricola, produccion, mercado cafetero o Federacion Nacional de Cafeteros, marca descartar=true
- Elige una sola categoria valida entre: mercado, clima, consejos, fnc, produccion, internacional, el_pital
- El titulo debe sonar natural en espanol colombiano
- El resumen debe tener maximo 220 caracteres
- El contenido debe tener 2 o 3 parrafos breves

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
                content: 'Eres un editor periodistico especializado en resumir noticias reales del sector cafetero. Respondes solo con JSON valido.'
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.35,
        max_tokens: 900,
        response_format: { type: 'json_object' },
    });

    const texto = completion.choices[0].message.content;
    const parsed = JSON.parse(texto);

    if (parsed.descartar) {
        return {
            descartar: true,
            motivo: parsed.motivo?.trim() || 'Articulo no relacionado con el sector cafetero.',
        };
    }

    return {
        titulo: eliminarContextoForzado(
            resolverTituloFinal(parsed.titulo?.trim(), articulo.titulo),
            articulo
        ),
        resumen: eliminarContextoForzado(parsed.resumen?.trim(), articulo),
        contenido: eliminarContextoForzado(parsed.contenido?.trim(), articulo),
        categoria: (parsed.categoria || articulo.categoriaSugerida || 'mercado').toLowerCase().trim(),
    };
}

async function existeFuenteGuardada(sourceHash, sourceUrl) {
    if (!sourceHash && !sourceUrl) return false;
    return Boolean(await Noticia.findOne({
        $or: [
            ...(sourceHash ? [{ sourceHash }] : []),
            ...(sourceUrl ? [{ sourceUrl }] : []),
        ]
    }).select('_id'));
}

export async function generarNoticiasDelDia() {
    if (!process.env.OPENAI_API_KEY) { 
        console.warn("[NoticiaAuto] ❌ OPENAI_API_KEY no configurada.");
        return 0;
    }
    if (!process.env.NEWSAPI_KEY) {
        console.warn("[NoticiaAuto] ❌ NEWSAPI_KEY no configurada.");
        return 0;
    }
    console.log('[NoticiaAuto] Iniciando ciclo de generacion con fuentes reales...');

    const maxNoticias = parseInt(process.env.NOTICIAS_POR_CICLO || '5');
    const horasRevisionDuplicados = parseInt(process.env.NOTICIAS_HORAS_REVISAR_DUPLICADOS || '48');
    const ctx = await obtenerContexto();
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
        if (yaExisteFuente) continue;

        let adaptada;
        try {
            adaptada = await adaptarArticuloConIA(articulo, ctx);
        } catch (error) {
            console.error(`[NoticiaAuto] Error adaptando articulo '${articulo.titulo}':`, error.message);
            continue;
        }

        if (adaptada.descartar) {
            console.log(`[NoticiaAuto] Articulo descartado por relevancia: '${articulo.titulo}'`);
            continue;
        }

        if (!adaptada.titulo || !adaptada.resumen || !adaptada.contenido) {
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
            console.log(`[NoticiaAuto] Duplicado por contenido descartado: '${adaptada.titulo}'`);
            continue;
        }

        try {
            const imagenSeleccionada = seleccionarImagenNoticia(articulo, adaptada.categoria);
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
            });

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
    const {
        maxHorasSinNoticias = parseInt(process.env.NOTICIAS_MAX_HORAS_SIN_ACTUALIZAR || '8'),
    } = opciones;

    if (!process.env.OPENAI_API_KEY) {
        console.warn('[NoticiaAuto] OPENAI_API_KEY no configurada. Se omite la actualizacion automatica.');
        return false;
    }

    const ultimaNoticia = await Noticia.findOne({ autoGenerada: true })
        .sort({ createdAt: -1 })
        .select('createdAt titulo');

    const limite = new Date(Date.now() - maxHorasSinNoticias * 60 * 60 * 1000);
    const necesitaActualizacion = !ultimaNoticia || ultimaNoticia.createdAt < limite;

    if (!necesitaActualizacion) return false;

    if (!generacionEnCurso) {
        console.log('[NoticiaAuto] Noticias desactualizadas. Iniciando refresco automatico...');
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
