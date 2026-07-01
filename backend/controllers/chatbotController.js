import OpenAI from 'openai';
import { normalizarTexto, contieneLenguajeOfensivo } from '../utils/filtroLenguaje.js';
import PrecioModel from '../models/precio.js';
import PrecioFNC from '../models/PrecioFNC.js';
import { esCompradorAprobado } from '../utils/compradorEstado.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SISTEMA_KAFFI = `Sos Kaffi, el asistente de CoffePrice.
Hablas en espanol claro, calido y cercano.
Ayudas a caficultores y compradores a usar la plataforma, entender precios, alertas, predicciones y tomar mejores decisiones.
Solo respondes preguntas relacionadas con CoffePrice, la compra y venta de café, precios, compradores, alertas, predicciones y uso de la plataforma.
Si te preguntan por historia, política, tecnología general, salud, tareas del colegio u otros temas ajenos a CoffePrice o al café, no los respondas.
En esos casos, di con amabilidad que solo puedes ayudar con la plataforma y con decisiones relacionadas con el café, y ofrece ejemplos de preguntas que sí puedes responder.
Respondes siempre en español y en máximo 3 párrafos cortos.
Da ayuda concreta antes de decir "revise la plataforma".
Si no tienes un dato exacto, no inventes numeros: explica que mirar y como decidir con lo que la persona ya tiene en pantalla.
Cuando respondas, prioriza:
1. Explicar en lenguaje simple.
2. Recomendar la siguiente accion util.
3. Dar criterios practicos para decidir.
Si la persona está en login, registro o verificación, responde con pasos cortos.
Si la persona esta en precios o predicciones, responde con recomendaciones accionables, no con frases genericas.
Si la persona usa lenguaje ofensivo, no devuelvas ofensas: marca un limite con respeto y vuelve a ofrecer ayuda util.`;

function esOfensivo(value = '') {
  return contieneLenguajeOfensivo(value);
}

async function obtenerContextoPreciosReales() {
  try {
    const precios = await PrecioModel.find()
      .populate({
        path: 'comprador',
        select: 'nombreempresa usuario estadoRevision',
        populate: { path: 'usuario', select: 'estado' },
      })
      .sort({ preciocarga: -1 });
 
    const vistos = new Set();
    const activos = precios.filter((p) => {
      const key = p.comprador?._id?.toString();
      if (!key || vistos.has(key)) return false;
      if (!esCompradorAprobado(p.comprador?.usuario, p.comprador)) return false;
      vistos.add(key);
      return true;
    });
 
    const mejoresPreciosHoy = activos.slice(0, 5).map((p) => ({
      comprador: p.comprador?.nombreempresa || 'Comprador',
      tipocafe: p.tipocafe,
      preciocarga: p.preciocarga,
      preciokg: p.preciokg,
      actualizadoAt: p.updatedAt,
    }));
 
    const fnc = await PrecioFNC.findOne().sort({ createdAt: -1 });
 
    return {
      mejoresPreciosHoy,
      precioFNC: fnc ? { precio: fnc.precio, fuente: fnc.fuente, fecha: fnc.createdAt } : null,
    };
  } catch (error) {
    console.error('Error obteniendo precios reales para Kaffi:', error);
    return { mejoresPreciosHoy: [], precioFNC: null };
  }
}

function contieneAlguno(texto, palabras) {
  return palabras.some((palabra) => texto.includes(palabra));
}

const PALABRAS_TEMA_CAFE = [
  'cafe',
  'caficult',
  'coffeprice',
  'kaffi',
  'precio',
  'precios',
  'comprador',
  'compradores',
  'productor',
  'productores',
  'venta',
  'vender',
  'compra',
  'comprar',
  'fnc',
  'federacion',
  'pergamino',
  'carga',
  'kilo',
  'kg',
  'prediccion',
  'predicciones',
  'tendencia',
  'confianza',
  'alerta',
  'alertas',
  'mercado',
  'precio minimo',
  'precio maximo',
  'precio esperado',
  'secado',
  'pasilla',
  'organico',
  'especial',
  'verde',
  'clima',
  'huila',
  'pital',
];

const PALABRAS_PLATAFORMA = [
  'pagina',
  'plataforma',
  'pantalla',
  'registro',
  'registr',
  'login',
  'sesion',
  'iniciar',
  'contrasena',
  'clave',
  'correo',
  'codigo',
  'verificar',
  'perfil',
  'panel',
  'dashboard',
  'cuenta',
  'publicar',
  'mapa',
  'filtro',
  'buscar',
  'detalle',
  'comprador',
  'productor',
];

const PALABRAS_AYUDA_GENERAL = [
  'ayuda',
  'ayudeme',
  'ayudame',
  'explique',
  'explicame',
  'expliqueme',
  'recomienda',
  'recomiendame',
  'recomiendeme',
  'que hago',
  'como hago',
  'como funciona',
  'para que sirve',
  'esta pantalla',
  'aqui',
  'siguiente paso',
];

const PALABRAS_FUERA_DE_TEMA = [
  'segunda guerra mundial',
  'guerra mundial',
  '11 de septiembre',
  'world trade center',
  'torres gemelas',
  'historia universal',
  'presidente de',
  'capital de',
  'quien descubrio',
  'matematic',
  'fisica',
  'quimica',
  'biologia',
  'programacion',
  'javascript',
  'python',
  'celular',
  'iphone',
  'android',
  'netflix',
  'futbol',
  'champions',
  'real madrid',
  'barcelona',
  'salud',
  'medicina',
];

function esSaludo(texto = '') {
  return ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches'].includes(texto.trim());
}

function construirContextoDeNegocio(contexto = {}) {
  const bloques = [];

  if (contexto?.datosPagina?.resumenPrecios) {
    const resumen = contexto.datosPagina.resumenPrecios;
    bloques.push(
      `Resumen de precios actual: mejor pago ${resumen.mejorPrecio ?? 'sin dato'}, comprador destacado ${resumen.mejorComprador || 'sin dato'}, precio FNC ${resumen.precioFNC ?? 'sin dato'}, diferencia contra FNC ${resumen.diferenciaVsFNC ?? 'sin dato'}.`
    );
  }

  if (contexto?.datosPagina?.prediccionResumen) {
    const prediccion = contexto.datosPagina.prediccionResumen;
    bloques.push(
      `Prediccion resumen: precio esperado ${prediccion.precioEstimado ?? 'sin dato'}, tendencia ${prediccion.tendencia || 'sin dato'}, confianza ${prediccion.confianza ?? 'sin dato'}%.`
    );
  }

  if (contexto?.datosPagina?.historialPredicciones) {
    const historial = contexto.datosPagina.historialPredicciones;
    bloques.push(
      `Historial consultado: ${historial.diasConsultados ?? 0} días, promedio ${historial.promedio ?? 'sin dato'}, mínimo ${historial.minimo ?? 'sin dato'}, máximo ${historial.maximo ?? 'sin dato'}, confianza media ${historial.confianzaPromedio ?? 'sin dato'}%.`
    );
  }

  return bloques.join(' ');
}

function esConsultaDelDominio({ ultimoMensaje, contexto }) {
  const texto = normalizarTexto(ultimoMensaje);
  const pagina = normalizarTexto(contexto?.pagina || contexto?.ruta || '');
  const ayudaPagina = normalizarTexto(contexto?.ayudaPagina || '');
  const resumenAyuda = normalizarTexto(contexto?.resumenAyuda || '');
  const textoContextoNegocio = normalizarTexto(construirContextoDeNegocio(contexto));

  if (!texto.trim()) return true;
  if (esSaludo(texto)) return true;

  if (
    contieneAlguno(texto, PALABRAS_FUERA_DE_TEMA) &&
    !contieneAlguno(texto, [...PALABRAS_TEMA_CAFE, ...PALABRAS_PLATAFORMA])
  ) {
    return false;
  }

  if ((pagina || ayudaPagina || resumenAyuda) && contieneAlguno(texto, PALABRAS_AYUDA_GENERAL)) {
    return true;
  }

  return contieneAlguno(texto, [
    ...PALABRAS_TEMA_CAFE,
    ...PALABRAS_PLATAFORMA,
    ...PALABRAS_AYUDA_GENERAL,
    pagina,
    ayudaPagina,
    resumenAyuda,
    textoContextoNegocio,
  ]);
}

function obtenerRespuestaFueraDeTema({ contexto }) {
  const sugerenciasBase = obtenerSugerencias({
    ultimoMensaje: contexto?.pagina === '/precios' ? 'precio' : '',
    contexto,
  });

  return {
    respuesta:
      'Solo puedo ayudarle con CoffePrice y con temas del café, como precios, compradores, alertas, predicciones y uso de la plataforma. Si quiere, pregúnteme por quién paga mejor, si conviene vender hoy, cómo leer la predicción o cómo hacer algo en esta pantalla.',
    sugerencias: sugerenciasBase,
  };
}

function obtenerRespuestaGuiada({ ultimoMensaje, contexto }) {
  const texto = normalizarTexto(ultimoMensaje);
  const pagina = contexto?.pagina || '';
  const resumenPrecios = contexto?.datosPagina?.resumenPrecios || null;
  const prediccionResumen = contexto?.datosPagina?.prediccionResumen || null;
  const historialPredicciones = contexto?.datosPagina?.historialPredicciones || null;

  if (esOfensivo(texto)) {
    return {
      respuesta:
        'Puedo ayudarte, pero hablemos con respeto. Si me dices que necesitas hacer, te respondo con pasos claros y utiles.',
      sugerencias: ['Ayudeme con esta pantalla', 'Explique paso a paso', 'Que me recomienda hacer'],
    };
  }
  if (contieneAlguno(texto, ['de donde sale', 'de donde salio', 'fuente del precio', 'como calculan el precio', 'por que este precio', 'de donde viene este precio'])) {
    const fuenteFNC = contexto?.datosPagina?.fuentePrecioFNC;
    const fncTexto = fuenteFNC?.precio
      ? ` El precio de referencia FNC (${Number(fuenteFNC.precio).toLocaleString('es-CO')} pesos) se toma directo de la Federación Nacional de Cafeteros y se actualiza automáticamente los días hábiles.`
      : '';

    return {
      respuesta:
        `Los precios por comprador los publica cada comprador registrado y aprobado en El Pital; se actualizan cuando ellos mismos cambian su precio, por eso cada tarjeta muestra la fecha de la última actualización.${fncTexto} Si un precio te parece desactualizado, revisa esa fecha antes de decidir con quién vender.`,
      sugerencias: ['Quien paga mejor hoy', 'Comparar con FNC', 'Conviene vender hoy'],
    };
  }


  if (
    pagina === '/precios' ||
    contieneAlguno(texto, ['vender', 'precio', 'comprador', 'paga mejor', 'conviene'])
  ) {
    if (contieneAlguno(texto, ['quien paga mejor', 'paga mejor', 'mejor comprador', 'comprador'])) {
      const detallePrecio =
        resumenPrecios?.mejorComprador && resumenPrecios?.mejorPrecio
          ? ` Hoy va adelante ${resumenPrecios.mejorComprador} con ${Number(resumenPrecios.mejorPrecio).toLocaleString('es-CO')} pesos.`
          : '';

      return {
        respuesta:
          `Para elegir mejor comprador, mire tres cosas: quién aparece con el mejor pago hoy, si ese precio es por carga o por kilo según su café, y hace cuánto lo actualizó.${detallePrecio} Si dos compradores están parecidos, confirme directo con el que tenga el dato más reciente.`,
        sugerencias: ['Comparar con FNC', 'Conviene vender hoy', 'Que debo revisar primero'],
      };
    }

    const comparacionFnc =
      typeof resumenPrecios?.diferenciaVsFNC === 'number'
        ? resumenPrecios.diferenciaVsFNC >= 0
          ? ` Hoy el mejor pago esta ${Math.abs(resumenPrecios.diferenciaVsFNC).toLocaleString('es-CO')} pesos por encima de la referencia FNC.`
          : ` Hoy el mejor pago esta ${Math.abs(resumenPrecios.diferenciaVsFNC).toLocaleString('es-CO')} pesos por debajo de la referencia FNC.`
        : '';
    const lecturaPrediccion =
      prediccionResumen?.tendencia && typeof prediccionResumen?.confianza === 'number'
        ? ` La prediccion apunta a que ${prediccionResumen.tendencia === 'sube' ? 'podria subir' : prediccionResumen.tendencia === 'baja' ? 'podria bajar' : 'seguiria parecido'} con una confianza de ${prediccionResumen.confianza}%.`
        : '';

    return {
      respuesta:
        `Para decidir si vender hoy, compare primero el mejor pago de la lista con el precio FNC.${comparacionFnc} Luego mire la predicción de mañana: si el cambio esperado es pequeño, normalmente conviene confirmar hoy con el comprador en vez de esperar por una diferencia mínima.${lecturaPrediccion} También revise que el tipo de café coincida con el precio publicado.`,
      sugerencias: ['Quien paga mejor', 'Comparar con FNC', 'Como leer la prediccion'],
    };
  }

  if (pagina === '/predicciones' || contieneAlguno(texto, ['prediccion', 'confianza', 'esperar', 'historial'])) {
    const lecturaHistorial =
      historialPredicciones?.diasConsultados
        ? ` En la consulta actual está revisando ${historialPredicciones.diasConsultados} días, con un promedio de ${Number(historialPredicciones.promedio || 0).toLocaleString('es-CO')} pesos y una confianza media de ${historialPredicciones.confianzaPromedio || 0}%.`
        : '';

    return {
      respuesta:
        `La predicción sirve como guía, no como promesa. Si la confianza está alta, te ayuda a tomar la señal más en serio; si está media o baja, úsala solo para acompañar el precio de hoy.${lecturaHistorial} Lo más útil es mirar si el rango esperado cambia mucho frente a hoy y si esa diferencia de verdad compensa esperar.`,
      sugerencias: ['Que significa la confianza', 'Comparar con precio de hoy', 'Me conviene esperar'],
    };
  }

  if (pagina === '/alertas' || contieneAlguno(texto, ['alerta', 'avisar', 'notificar'])) {
    return {
      respuesta:
        'Una buena alerta no se pone por ponerla. Elige un precio que de verdad te haria actuar: por ejemplo, un valor por encima de lo que suelen pagar hoy. Si la dejas muy cerca del precio actual, te avisara por cambios pequenos que tal vez no te sirvan.',
      sugerencias: ['Que precio poner', 'Como crear una alerta', 'Cada cuanto revisar'],
    };
  }

  if (pagina === '/login' || contieneAlguno(texto, ['iniciar sesion', 'entrar', 'contrasena', 'clave'])) {
    return {
      respuesta:
        'Para entrar necesitas el correo con el que te registraste y tu contraseña. Si no recuerdas la clave, usa la opción de recuperarla antes de intentar muchas veces. Si el correo y la clave están bien y aún no entra, revisa que no haya espacios de más al copiar.',
      sugerencias: ['No recuerdo mi contraseña', 'Qué correo debo usar', 'Quiero crear una cuenta'],
    };
  }

  if (pagina === '/register' || contieneAlguno(texto, ['registro', 'registrar', 'crear cuenta', 'cuenta'])) {
    return {
      respuesta:
        'Para registrarte, primero elige bien el tipo de cuenta: productor si vendes tu café, comprador si publicas precios de compra. Después llena nombre, correo y contraseña con calma, y usa un correo que sí revises porque allí llega la verificación.',
      sugerencias: ['Cuenta de productor', 'Cuenta de comprador', 'Que datos necesito'],
    };
  }

  if (pagina === '/verify-email' || contieneAlguno(texto, ['codigo', 'correo', 'verificar', 'verificacion'])) {
    return {
      respuesta:
        'Si no llega el código, revisa primero spam o promociones y luego usa reenviar. Cuando lo tengas, escríbelo completo tal como llegó. Después de verificar, la cuenta queda lista o sigue al paso siguiente según el tipo de usuario.',
      sugerencias: ['No me llegó el código', 'Reenviar código', 'Qué sigue después'],
    };
  }

  return null;
}

function obtenerSugerencias({ ultimoMensaje, contexto }) {
  const texto = normalizarTexto(ultimoMensaje);
  const pagina = contexto?.pagina || '';

  if (esOfensivo(texto)) {
    return ['Hablemos con respeto', 'Ayudeme con esta pantalla', 'Explique paso a paso'];
  }

  if (texto.includes('precio') || texto.includes('costo') || texto.includes('vender')) {
    return ['Comparar con FNC', 'Quien paga mejor', 'Me conviene vender hoy'];
  }

  if (texto.includes('prediccion') || texto.includes('confianza') || texto.includes('esperar')) {
    return ['Que significa la confianza', 'Comparar con precio de hoy', 'Me conviene esperar'];
  }

  if (texto.includes('registro') || texto.includes('cuenta')) {
    return ['Que datos necesito', 'Cuenta de productor', 'Cuenta de comprador'];
  }

  if (texto.includes('codigo') || texto.includes('correo') || texto.includes('verificar')) {
    return ['No me llegó el código', 'Reenviar código', 'Qué hago ahora'];
  }

  if (texto.includes('alerta')) {
    return ['Crear una alerta', 'Como funciona una alerta', 'Que precio me conviene poner'];
  }

  if (pagina === '/precios') {
    return ['Quien paga mejor', 'Comparar con FNC', 'Conviene vender hoy'];
  }

  if (pagina === '/predicciones') {
    return ['Como leer esta prediccion', 'Que significa la confianza', 'Comparar con precio de hoy'];
  }

  if (pagina === '/alertas') {
    return ['Como crear una alerta', 'Que precio me conviene poner', 'Que canal usar'];
  }

  if (pagina === '/register') {
    return ['Que tipo de cuenta me sirve', 'Que datos necesito', 'Como verificar el correo'];
  }

  if (pagina === '/login') {
    return ['No recuerdo mi contraseña', 'Cómo iniciar sesión', 'Quiero crear una cuenta'];
  }

  if (pagina === '/verify-email') {
    return ['No me llegó el código', 'Reenviar código', 'Qué pasa después'];
  }

  return ['Ayudeme con esta pantalla', 'Que me recomienda hacer', 'Expliquemelo facil'];
}

export const chatWithKaffi = async (req, res) => {
  try {
    const { mensajes, contexto } = req.body;

    if (!mensajes || !Array.isArray(mensajes)) {
      return res.status(400).json({ message: 'mensajes inválidos' });
    }

    const ultimoMensaje = mensajes[mensajes.length - 1]?.content || '';
    const datosReales = await obtenerContextoPreciosReales();
    const mejorPrecioHoy = datosReales.mejoresPreciosHoy[0] || null;
    const contextoEnriquecido = {
      ...contexto,
      datosPagina: {
      ...contexto?.datosPagina,
        resumenPrecios: contexto?.datosPagina?.resumenPrecios || {
          mejorPrecio: mejorPrecioHoy?.preciocarga ?? null,
          mejorComprador: mejorPrecioHoy?.comprador ?? null,
          precioFNC: datosReales.precioFNC?.precio ?? null,
          diferenciaVsFNC: mejorPrecioHoy && datosReales.precioFNC
            ? mejorPrecioHoy.preciocarga - datosReales.precioFNC.precio
            : null,
        },
        listaPreciosHoy: datosReales.mejoresPreciosHoy,
        fuentePrecioFNC: datosReales.precioFNC,
      },
    };

    const guiada = obtenerRespuestaGuiada({ ultimoMensaje, contexto: contextoEnriquecido });

    if (guiada) {
      return res.json(guiada);
    }

    if (!esConsultaDelDominio({ ultimoMensaje, contexto: contextoEnriquecido })) {
    return res.json(obtenerRespuestaFueraDeTema({ contexto: contextoEnriquecido }));
    }

    const contextoSerializado = contextoEnriquecido
    ? `Contexto actual en formato JSON: ${JSON.stringify(contextoEnriquecido)}. Contexto de negocio resumido: ${construirContextoDeNegocio(contextoEnriquecido)}`
      : null;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SISTEMA_KAFFI },
        ...(contextoSerializado ? [{ role: 'system', content: contextoSerializado }] : []),
        ...mensajes,
      ],
      max_tokens: 420,
      temperature: 0.6,
    });

    const sugerencias = obtenerSugerencias({ ultimoMensaje, contexto: contextoEnriquecido });

    res.json({
      respuesta: response.choices[0].message.content,
      sugerencias,
    });
  } catch (error) {
    console.error('Error en Kaffi:', error);
    res.status(500).json({
      message: 'Error al consultar a Kaffi',
      error: error.message,
    });
  }
};
