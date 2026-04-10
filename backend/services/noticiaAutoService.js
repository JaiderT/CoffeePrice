import OpenAI from 'openai';
import Noticia from '../models/noticia.js';
import PrecioModel from '../models/precio.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Imagenes por categoria (Unsplash - gratuitas)
const IMAGENES = {
    mercado:       'https://images.unsplash.com/photo-1611174743420-3d7df880ce32?w=800',
    clima:         'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800',
    consejos:      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    fnc:           'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800',
    produccion:    'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=800',
    internacional: 'https://images.unsplash.com/photo-1524350876685-274059332603?w=800',
    el_pital:      'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=800',
};
async function obtenerContexto() {
    const precios = await PrecioModel.find()
        .populate('comprador', 'nombreempresa direccion')
        .sort({ preciocarga: -1 })
        .limit(5);
    const mejorPrecio = precios[0]?.preciocarga || 0;
    const compradorTop = precios[0]?.comprador?.nombreempresa || 'sin datos';
    const precioPromedio = precios.length > 0 ? Math.round(precios.reduce((s, p) => s + p.preciocarga, 0)/ precios.length) : 0;

    let trm = 4100;
    try {
        const hoy = new Date().toISOString().split('T')[0];
        const res = await fetch(`https://www.datos.gov.co/resource/mcec-87by.json` + `?vigenciadesde=${hoy}&$limit=1`);
        const data = await res.json();
        if (data[0]?.valor) trm = parseFloat(data[0].valor);
    } catch {
        /* usar fallback */
    }
    let climaTexto = 'condiciones normales';
    let temperatura = 22;
    let lluvia = 0;
    let descripClima = 'Parcialmente nublado';
    try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast' + '?latitude=1.85&longitude=-76.05' + '&current=temperature_2m,precipitation,weather_code,wind_speed_10m' + '&timezone=America%2FBogota');
        const data = await res.json();
        const cod = data.current.weather_code;
        temperatura = data.current.temperature_2m;
        lluvia = data.current.precipitation;

        if (cod === 0) descripClima = 'Cielo despejado';
        else if (cod <= 3) descripClima = 'Parcialmente nublado';
        else if (cod <= 48) descripClima = 'Nublado';
        else if (cod <= 67) descripClima = `lluvia (${lluvia}mm)`;
        else if (cod <= 82) descripClima = 'Aguacero';
        else descripClima = 'Tormenta electrica';

        climaTexto = `${descripClima}, ${temperatura}C`;
    } catch { }
    const hora = new Date(new Date().toLocaleString('en-US', {
        timeZone: 'America/Bogota'})).getHours();
            let ciclo = 'manana';
            if (hora >= 0  && hora < 6)  ciclo = 'madrugada';
            else if (hora >= 6  && hora < 12) ciclo = 'mañana';
            else if (hora >= 12 && hora < 18) ciclo = 'tarde';
            else ciclo = 'noche';

            return { precios, mejorPrecio, compradorTop, precioPromedio, trm, climaTexto, temperatura, lluvia, descripClima, ciclo };
}
function construirPrompt (ctx) {
    const fecha = new Date().toLocaleDateString('es-CO', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota'
    });

    const contextoBase = `CONTEXTO ACTUAL DE EL PITAL, HUILA - ${fecha.toUpperCase()}:
    - Mejor precio del cafe hoy: $${ctx.mejorPrecio.toLocaleString()} COP por carga (125 kg)
    - Comprador que mejor paga: ${ctx.compradorTop}
    - Precio promedio en la zona: $${ctx.precioPromedio.toLocaleString()} COP por carga
    - TRM de dolar hoy: $${ctx.trm.toLocaleString()} COP por dolar
    - Clima en EL Pital: ${ctx.climaTexto}
    - Ciclo del dia: ${ctx.ciclo}`;

    //Instruccion 
    const instruccionesPorCiclo = {
        madrugada: `Genera 3 noticias para caficultores que empiezan la jornada muy temprano.
        Temas: resumen del mercado del cafe para hoy, precio de apertura en bolsa de NY,
        expectativas del dia. Tono: motivador, orientado a la accion.`,

        mañana: `Genera 3 noticias enfocadas en el precio y el mercado de la mañana. 
        Temas: comparacion del mejor precio local con el precio FNC, que comprador conviene visitar hoy, como negociar la venta.
        Tono: practico, directo, util para tomar decision de venta hoy.`,

        tarde: `Genera 3 noticias variadas: unas sobre El Pital o el Huila cafetero, y otras de consejos practicos de produccion o postcosecha.
        Temas posibles: eventos municipales, tradicion cafetera, secado del cafe, beneficio humedo, certificaciones de calidad, turismo cafetero.
        Tono: cercano, cultural, educativo.`,

        noche: `Genera 3 noticias: unas sobre el mercado internacional del cafe y otras con el resumen del dia en El Pital.
        Temas: precio del cafe en la bolsa de Londres o Nueva York, exportaciones colombianas, demanda mundial.
        Tono: informativo, con datos concretos.`
    };
    const instruccionCiclo = instruccionesPorCiclo[ctx.ciclo] || instruccionesPorCiclo.mañana;
    return `Eres el periodista de CoffePrice, plataforma digital para caficultores del municipio de El Pital, Huila, Colombia.
    ${contextoBase}
    ${instruccionCiclo}
    REGLAS OBLIGATORIAS:
    - Escribe en español colombiano natural, sin tecnicismo innecesarios
    - Cada noticia debe de ser util y accionable para un caficultor real
    - Menciona El Pital, el Huila  o la region del sur del Huila cuando sea relevante
    - Los precios deben expresarse en COP (pesos colommbianos)
    - No inventes datos especificos que no tienes (precios exactos de bolsa, etc.)
    - Si mencionas el precio de bolsa NY, di 'aproximadamente' o 'segun tendecias' 
    
    CATEGORIAS disponibles: mercado, clima, consejos, fnc, produccion, internacional, el_pital
    
    Responde EXCLUSIVAMENTE con este JSON (sin markdown, sin texto adicional):
    [
        {
            "titulo":"Titulo claro y llamativo, maximo 90 caracteres",
            "resumen":"Dos oraciones resumiendo la noticia, maximo 220 caracteres",
            "contenido":"Tres o cuatro parrafos completos con la noticia detallada",
            "categoria":""una de las categorias listadas arriba"
        }
    ]`;
}
export async function generarNoticiasDelDia() {
    console.log('[NoticiaAuto] Iniciando ciclo de generacion....');

    const ctx = await obtenerContexto();
    const prompt = construirPrompt(ctx);
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role:'system',
                    content: 'Eres un periodista especializado en el sector cafetero colombiano.' + ' Siempre responde con JSON valido, sin texto adicional.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.75,
            max_tokens: 2000,
            response_format: {type: 'json_object'},
        });
        const texto = completion.choices[0].message.content;
        let noticiasGeneradas;
        try {
            const parsed = JSON.parse(texto);
            noticiasGeneradas = Array.isArray(parsed) ? parsed : parsed.noticias || parsed.items || Object.values(parsed)[0];
        } catch (parseErr) {
            console.error('[NoticiaAuto] Error parseando JSON:', parseErr.message);
            return 0;
        }
        const maxNoticias = parseInt(process.env.NOTICIAS_POR_CICLO || '2');
        let creadas = 0;
        for (const noticiaRaw of noticiasGeneradas.slice(0, maxNoticias)) {
            const noticia = {
                ...noticiaRaw,
                categoria: (noticiaRaw.categoria || noticiaRaw.categoria || '').toLowerCase().trim()
            };
            if (!noticia.titulo || !noticia.contenido || !noticia.categoria) {
                console.warn('[NoticiaAuto] Noticia imcompleta, saltando....');
                continue;
            }
            const hace12h = new Date(Date.now() - 12 * 60 * 60 * 1000);
            const primeras30 = noticia.titulo.slice(0, 30);
            const existe = await Noticia.findOne({
                titulo: { $regex: primeras30, $options: 'i' },
                createdAt: { $gte: hace12h}
            });
            if (existe) {
                console.log(`[NoticiaAuto] Duplicado detectado: 
                    '${primeras30}...'`);
                    continue;
            }
            const categoriasValidas = ['mercado', 'clima', 'consejos','fnc', 'produccion', 'internacional', 'el_pital'];
            const categoria = categoriasValidas.includes(noticia.categoria) ? noticia.categoria : 'mercado';
            await Noticia.create({
                titulo: noticia.titulo.trim(),
                resumen: noticia.resumen?.trim() || noticia.titulo,
                contenido: noticia.contenido.trim(),
                categoria,
                fuente: 'coffeprice IA',
                imagen: IMAGENES[categoria] || IMAGENES.mercado,
                autoGenerada: true,
                cicloGeneracion: ctx.ciclo,
            });
            creadas++;
            console.log(`[NoticiaAuto] Noticia creada: '${noticia.titulo}'`);
        }
        console.log(`[NoticiaAuto] ciclo finalizado. ${creadas} noticias nuevas.`);
        return creadas;
    } catch (error) {
        console.error('[NoticiaAuto] Error en ChatGPT:', error.message);
        return 0;
    }
}
// Elimina noticias automaticas
export async function limpiarNoticiasViejas() {
    const dias = parseInt(process.env.NOTICIAS_DIAS_CONSERVAR || '7');
    const fechaCorte = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

    const resultado = await Noticia.deleteMany({
        autoGenerada: true,
        createdAt:    { $lt: fechaCorte }
    });

    if (resultado.deletedCount > 0) {
        console.log(`[NoticiaAuto] Limpieza: ${resultado.deletedCount} noticias viejas eliminadas`);
    }
    return resultado.deletedCount;
}
