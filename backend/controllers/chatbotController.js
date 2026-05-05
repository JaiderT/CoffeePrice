import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SISTEMA_KAFFI = `Sos Kaffi, el asistente de CoffePrice.
Hablas en espanol claro, calido y cercano.
Ayudas a caficultores y compradores a usar la plataforma, entender precios, alertas, predicciones y tomar mejores decisiones.
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

function obtenerRespuestaGuiada({ ultimoMensaje, contexto }) {
  const texto = normalizarTexto(ultimoMensaje);
  const pagina = contexto?.pagina || '';

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
      return {
        respuesta:
          'Para elegir mejor comprador, mire tres cosas: quien aparece con el mejor pago hoy, si ese precio es por carga o por kilo segun su cafe, y hace cuanto lo actualizo. Si dos compradores estan parecidos, confirme directo con el que tenga el dato mas reciente.',
        sugerencias: ['Comparar con FNC', 'Conviene vender hoy', 'Que debo revisar primero'],
      };
    }

    return {
      respuesta:
        'Para decidir si vender hoy, compare primero el mejor pago de la lista con el precio FNC. Luego mire la prediccion de manana: si el cambio esperado es pequeno, normalmente conviene confirmar hoy con el comprador en vez de esperar por una diferencia minima. Tambien revise que el tipo de cafe coincida con el precio publicado.',
      sugerencias: ['Quien paga mejor', 'Comparar con FNC', 'Como leer la prediccion'],
    };
  }

  if (pagina === '/predicciones' || contieneAlguno(texto, ['prediccion', 'confianza', 'esperar', 'historial'])) {
    return {
      respuesta:
        'La prediccion sirve como guia, no como promesa. Si la confianza esta alta, te ayuda a tomar la senal mas en serio; si esta media o baja, usala solo para acompanar el precio de hoy. Lo mas util es mirar si el rango esperado cambia mucho frente a hoy y si esa diferencia de verdad compensa esperar.',
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

    const contextoSerializado = contexto
      ? `Contexto actual en formato JSON: ${JSON.stringify(contexto)}`
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
