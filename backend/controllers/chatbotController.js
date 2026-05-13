import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SISTEMA_KAFFI = `Sos Kaffi, el asistente de CoffePrice.
Hablas en espanol claro, calido y cercano.
Ayudas a caficultores y compradores a usar la plataforma, entender precios, alertas, predicciones y tomar mejores decisiones.
Solo respondes preguntas relacionadas con CoffePrice, la compra y venta de cafe, precios, compradores, alertas, predicciones y uso de la plataforma.
Si te preguntan por historia, politica, tecnologia general, salud, tareas del colegio u otros temas ajenos a CoffePrice o al cafe, no los respondas.
En esos casos, di con amabilidad que solo puedes ayudar con la plataforma y con decisiones relacionadas con el cafe, y ofrece ejemplos de preguntas que si puedes responder.
Respondes siempre en espanol y en maximo 3 parrafos cortos.
Da ayuda concreta antes de decir "revise la plataforma".
Si no tienes un dato exacto, no inventes numeros: explica que mirar y como decidir con lo que la persona ya tiene en pantalla.
Cuando respondas, prioriza:
1. Explicar en lenguaje simple.
2. Recomendar la siguiente accion util.
3. Dar criterios practicos para decidir.
Si la persona esta en login, registro o verificacion, responde con pasos cortos.
Si la persona esta en precios o predicciones, responde con recomendaciones accionables, no con frases genericas.
Si la persona usa lenguaje ofensivo, no devuelvas ofensas: marca un limite con respeto y vuelve a ofrecer ayuda util.`;

const PATRONES_OFENSIVOS = [
  /\bidiot[ao]s?\b/,
  /\bimbecil(?:es)?\b/,
  /\bestupid[oa]s?\b/,
  /\bpendej[oa]s?\b/,
  /\bmaric[ao]n(?:es)?\b/,
  /\bhijueputa\b/,
  /\bhpta\b/,
  /\bmalparid[oa]s?\b/,
  /\bgonorre?a\b/,
  /\bpiro+b[oa]s?\b/,
  /\bperr[oa]s?\b/,
  /\bcallate\b/,
  /\bno sirves\b/,
  /\bque inutil\b/,
];

function normalizarTexto(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function esOfensivo(value = '') {
  const texto = normalizarTexto(value);
  return PATRONES_OFENSIVOS.some((patron) => patron.test(texto));
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
      `Historial consultado: ${historial.diasConsultados ?? 0} dias, promedio ${historial.promedio ?? 'sin dato'}, minimo ${historial.minimo ?? 'sin dato'}, maximo ${historial.maximo ?? 'sin dato'}, confianza media ${historial.confianzaPromedio ?? 'sin dato'}%.`
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
      'Solo puedo ayudarle con CoffePrice y con temas del cafe, como precios, compradores, alertas, predicciones y uso de la plataforma. Si quiere, pregúnteme por quien paga mejor, si conviene vender hoy, como leer la prediccion o como hacer algo en esta pantalla.',
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
          `Para elegir mejor comprador, mire tres cosas: quien aparece con el mejor pago hoy, si ese precio es por carga o por kilo segun su cafe, y hace cuanto lo actualizo.${detallePrecio} Si dos compradores estan parecidos, confirme directo con el que tenga el dato mas reciente.`,
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
        `Para decidir si vender hoy, compare primero el mejor pago de la lista con el precio FNC.${comparacionFnc} Luego mire la prediccion de manana: si el cambio esperado es pequeno, normalmente conviene confirmar hoy con el comprador en vez de esperar por una diferencia minima.${lecturaPrediccion} Tambien revise que el tipo de cafe coincida con el precio publicado.`,
      sugerencias: ['Quien paga mejor', 'Comparar con FNC', 'Como leer la prediccion'],
    };
  }

  if (pagina === '/predicciones' || contieneAlguno(texto, ['prediccion', 'confianza', 'esperar', 'historial'])) {
    const lecturaHistorial =
      historialPredicciones?.diasConsultados
        ? ` En la consulta actual esta revisando ${historialPredicciones.diasConsultados} dias, con un promedio de ${Number(historialPredicciones.promedio || 0).toLocaleString('es-CO')} pesos y una confianza media de ${historialPredicciones.confianzaPromedio || 0}%.`
        : '';

    return {
      respuesta:
        `La prediccion sirve como guia, no como promesa. Si la confianza esta alta, te ayuda a tomar la senal mas en serio; si esta media o baja, usala solo para acompanar el precio de hoy.${lecturaHistorial} Lo mas util es mirar si el rango esperado cambia mucho frente a hoy y si esa diferencia de verdad compensa esperar.`,
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
        'Para entrar necesitas el correo con el que te registraste y tu contrasena. Si no recuerdas la clave, usa la opcion de recuperarla antes de intentar muchas veces. Si el correo y la clave estan bien y aun no entra, revisa que no haya espacios de mas al copiar.',
      sugerencias: ['No recuerdo mi contrasena', 'Que correo debo usar', 'Quiero crear una cuenta'],
    };
  }

  if (pagina === '/register' || contieneAlguno(texto, ['registro', 'registrar', 'crear cuenta', 'cuenta'])) {
    return {
      respuesta:
        'Para registrarte, primero elige bien el tipo de cuenta: productor si vendes tu cafe, comprador si publicas precios de compra. Despues llena nombre, correo y contrasena con calma, y usa un correo que si revises porque alli llega la verificacion.',
      sugerencias: ['Cuenta de productor', 'Cuenta de comprador', 'Que datos necesito'],
    };
  }

  if (pagina === '/verify-email' || contieneAlguno(texto, ['codigo', 'correo', 'verificar', 'verificacion'])) {
    return {
      respuesta:
        'Si no llega el codigo, revisa primero spam o promociones y luego usa reenviar. Cuando lo tengas, escribelo completo tal como llego. Despues de verificar, la cuenta queda lista o sigue al paso siguiente segun el tipo de usuario.',
      sugerencias: ['No me llego el codigo', 'Reenviar codigo', 'Que sigue despues'],
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
    return ['No me llego el codigo', 'Reenviar codigo', 'Que hago ahora'];
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
    return ['No recuerdo mi contrasena', 'Como iniciar sesion', 'Quiero crear una cuenta'];
  }

  if (pagina === '/verify-email') {
    return ['No me llego el codigo', 'Reenviar codigo', 'Que pasa despues'];
  }

  return ['Ayudeme con esta pantalla', 'Que me recomienda hacer', 'Expliquemelo facil'];
}

export const chatWithKaffi = async (req, res) => {
  try {
    const { mensajes, contexto } = req.body;

    if (!mensajes || !Array.isArray(mensajes)) {
      return res.status(400).json({ message: 'mensajes invalidos' });
    }

    const ultimoMensaje = mensajes[mensajes.length - 1]?.content || '';
    const guiada = obtenerRespuestaGuiada({ ultimoMensaje, contexto });

    if (guiada) {
      return res.json(guiada);
    }

    if (!esConsultaDelDominio({ ultimoMensaje, contexto })) {
      return res.json(obtenerRespuestaFueraDeTema({ contexto }));
    }

    const contextoSerializado = contexto
      ? `Contexto actual en formato JSON: ${JSON.stringify(contexto)}. Contexto de negocio resumido: ${construirContextoDeNegocio(contexto)}`
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

    const sugerencias = obtenerSugerencias({ ultimoMensaje, contexto });

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
