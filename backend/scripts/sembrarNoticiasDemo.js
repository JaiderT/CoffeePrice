import 'dotenv/config';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Noticia from '../models/noticia.js';

const IMAGENES = {
    mercado: 'https://images.unsplash.com/photo-1611174743420-3d7df880ce32?w=1200',
    clima: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=1200',
    fnc: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=1200',
    produccion: 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=1200',
    consejos: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200',
};

const NOTICIAS_DEMO = [
    {
        titulo: 'Productores de El Pital comparan mejor los precios antes de vender la carga',
        resumen: 'La consulta diaria de precios ayuda a que más caficultores esperen el momento más conveniente para negociar su café.',
        contenido: 'En varios sectores de El Pital, productores vienen revisando con más frecuencia los precios reportados por los compradores antes de cerrar la venta de la carga. Ese hábito les está dando más claridad para decidir si vender de una vez o esperar un mejor movimiento del mercado.\n\nLa lectura constante de precios también les permite comparar quién está pagando mejor en la zona y reducir decisiones apuradas. Para la plataforma, este tipo de seguimiento es clave porque mejora la información con la que el caficultor sale a negociar.',
        categoria: 'mercado',
        fuente: 'Equipo CoffePrice',
        imagen: IMAGENES.mercado,
        publishedAt: new Date(),
    },
    {
        titulo: 'Lluvias intermitentes mantienen atentos a los caficultores en zona alta del municipio',
        resumen: 'El clima variable está haciendo que varios productores organicen mejor el secado y el manejo del café recién recolectado.',
        contenido: 'Las lluvias de los últimos días han obligado a muchos productores a ajustar jornadas de recolección, secado y transporte del café. Aunque no se reportan afectaciones generalizadas, sí hay preocupación por mantener la calidad del grano cuando el clima cambia de manera brusca.\n\nTener alertas oportunas y una lectura sencilla del comportamiento del tiempo puede ayudar a que el productor se anticipe y cuide mejor cada lote. Esa información se vuelve más valiosa en semanas de alta actividad en finca.',
        categoria: 'clima',
        fuente: 'Equipo CoffePrice',
        imagen: IMAGENES.clima,
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    },
    {
        titulo: 'Compradores y productores ven útil contar con un registro más claro del mercado local',
        resumen: 'Tener datos organizados por fecha, comprador y precio facilita las decisiones y mejora la confianza entre quienes participan en la cadena.',
        contenido: 'Una de las mayores necesidades del mercado local sigue siendo contar con información clara, actualizada y fácil de entender para todas las partes. Cuando el productor sabe quién compró, cuánto pagó y en qué fecha, la negociación se vuelve más transparente.\n\nPara los compradores también representa una ventaja, porque les permite mostrar continuidad en sus reportes y construir confianza con los caficultores del municipio. Ese orden ayuda a que el mercado local sea más competitivo y más comprensible.',
        categoria: 'produccion',
        fuente: 'Equipo CoffePrice',
        imagen: IMAGENES.produccion,
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    },
    {
        titulo: 'La información de la FNC sigue siendo referencia para entender el movimiento del café colombiano',
        resumen: 'Productores consultan reportes nacionales para comparar el comportamiento local con la dinámica general del sector cafetero.',
        contenido: 'Los datos publicados por la Federación Nacional de Cafeteros siguen siendo una guía importante para entender cómo se está moviendo el café en Colombia. Aunque cada municipio tiene sus propias particularidades, comparar el panorama local con la referencia nacional ayuda a tomar mejores decisiones.\n\nEn plataformas como CoffePrice, ese contexto resulta útil porque permite que el caficultor no vea solo el dato aislado del día, sino una lectura más completa del entorno en el que está vendiendo su producción.',
        categoria: 'fnc',
        fuente: 'Equipo CoffePrice',
        imagen: IMAGENES.fnc,
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
    },
    {
        titulo: 'Consejos sencillos para registrar mejor un precio y dejarlo útil para otros usuarios',
        resumen: 'Publicar datos completos y recientes mejora la calidad de la información que ve toda la comunidad cafetera en la plataforma.',
        contenido: 'Cuando un comprador o administrador publica un precio, lo ideal es hacerlo con datos recientes, claros y fáciles de verificar. Eso incluye cuidar el valor reportado, el nombre del comprador y el momento exacto en que se está compartiendo la información.\n\nMientras más ordenado esté ese registro, más útil se vuelve para otros usuarios que consultan la plataforma antes de vender su café. Una noticia o un dato bien publicado no solo informa: también genera confianza dentro de la comunidad.',
        categoria: 'consejos',
        fuente: 'Equipo CoffePrice',
        imagen: IMAGENES.consejos,
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
];

function crearHashDemo(noticia = {}) {
    return crypto
        .createHash('sha256')
        .update(`${noticia.titulo}|${noticia.categoria}|${noticia.publishedAt?.toISOString?.() || ''}`)
        .digest('hex');
}

async function main() {
    if (!process.env.MONGODB_URI) {
        throw new Error('Falta la variable de entorno MONGODB_URI');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    await Noticia.deleteMany({ fuente: 'Equipo CoffePrice', autoGenerada: false });

    const payload = NOTICIAS_DEMO.map((noticia) => ({
        ...noticia,
        autoGenerada: false,
        tipoImagen: 'fallback',
        cicloGeneracion: 'demo_presentacion',
        sourceHash: crearHashDemo(noticia),
    }));

    const creadas = await Noticia.insertMany(payload);
    console.log(`[Noticias Demo] Noticias sembradas: ${creadas.length}`);

    await mongoose.disconnect();
}

main().catch(async (error) => {
    console.error('[Noticias Demo] Error sembrando noticias demo:', error.message);
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    process.exit(1);
});
