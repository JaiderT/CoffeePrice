export const KAFFI_GUIDES = {
  home: {
    id: 'home',
    title: 'Bienvenida',
    onboarding: true,
    intro: 'Le muestro rapidito para que entienda de qué va la plataforma.',
    steps: [
      {
        text: 'Aquí puede mirar precios, ubicar compradores y aprender a moverse por CoffePrice.',
        target: null,
        cta: 'Entendido',
      },
    ],
  },
  register_productor: {
    id: 'register_productor',
    title: 'Registro de productor',
    onboarding: true,
    intro: 'Vamos suave. Le voy mostrando por dónde seguir.',
    steps: [
      {
        text: 'Primero deje marcada la opción Productor. Esa es para quien vende su café.',
        target: '[data-kaffi="register-role-productor"]',
        cta: 'Mostrar opción',
      },
      {
        text: 'Ahora llene nombre y apellido. Escríbalos como aparecen normalmente.',
        target: '[data-kaffi="register-nombre"]',
        cta: 'Ir al nombre',
      },
      {
        text: 'Después ponga un correo que sí use, porque allí le llega la verificación.',
        target: '[data-kaffi="register-email"]',
        cta: 'Ir al correo',
      },
      {
        text: 'Cree la contraseña y repítala igualita. Si puede, use letras y números para que quede más segura.',
        target: '[data-kaffi="register-password"]',
        cta: 'Ir a la contraseña',
      },
      {
        text: 'Por último pulse Crear cuenta. De ahí sigue la verificación del correo.',
        target: '[data-kaffi="register-submit"]',
        cta: 'Mostrar botón',
      },
    ],
  },
  register_comprador: {
    id: 'register_comprador',
    title: 'Registro de comprador',
    onboarding: true,
    intro: 'Le acompaño para dejar la cuenta lista y sin perderse.',
    steps: [
      {
        text: 'Primero cambie a la opción Comprador, porque esa cuenta es para publicar y manejar precios.',
        target: '[data-kaffi="register-role-comprador"]',
        cta: 'Mostrar opción',
      },
      {
        text: 'Llene sus datos personales con calma. Nombre, apellido y correo son la base.',
        target: '[data-kaffi="register-nombre"]',
        cta: 'Ir a los datos',
      },
      {
        text: 'Después cree la contraseña y repítala igual. Así la cuenta queda protegida.',
        target: '[data-kaffi="register-password"]',
        cta: 'Ir a la contraseña',
      },
      {
        text: 'Cuando ya todo esté bien, pulse Crear cuenta para seguir con la verificación.',
        target: '[data-kaffi="register-submit"]',
        cta: 'Mostrar botón',
      },
    ],
  },
  login: {
    id: 'login',
    title: 'Entrar a la cuenta',
    onboarding: true,
    intro: 'Eso es cortico. Le voy mostrando paso por paso.',
    steps: [
      {
        text: 'Primero escriba el correo con el que hizo el registro.',
        target: '[data-kaffi="login-email"]',
        cta: 'Ir al correo',
      },
      {
        text: 'Luego escriba la contraseña. Si no la ve bien, use el botón para revisarla.',
        target: '[data-kaffi="login-password"]',
        cta: 'Ir a la contraseña',
      },
      {
        text: 'Cuando ya esté todo, pulse Iniciar sesión.',
        target: '[data-kaffi="login-submit"]',
        cta: 'Mostrar botón',
      },
    ],
  },
  verify_email: {
    id: 'verify_email',
    title: 'Verificar correo',
    onboarding: false,
    intro: 'Vamos paso a paso para confirmar su cuenta sin enredos.',
    steps: [
      {
        text: 'Revise el correo que usó al registrarse. Allí le llegó un código de 6 dígitos.',
        target: null,
        cta: 'Entendido',
      },
      {
        text: 'Escriba el código completo. Si no llega, revise spam o vuelva a pedirlo.',
        target: null,
        cta: 'Seguir',
      },
    ],
  },
  precios_productor: {
    id: 'precios_productor',
    title: 'Mirar precios',
    onboarding: true,
    intro: 'Aquí la idea es ayudarle a leer rápido quién paga mejor.',
    steps: [
      {
        text: 'Arriba mire el mejor pago y la referencia FNC. Eso le da una idea clara de cómo amaneció el mercado.',
        target: '[data-kaffi="precios-resumen"]',
        cta: 'Mostrar resumen',
      },
      {
        text: 'Si quiere encontrar algo más fácil, use la búsqueda por nombre del comprador.',
        target: '[data-kaffi="precios-busqueda"]',
        cta: 'Ir a la búsqueda',
      },
      {
        text: 'También puede filtrar el tipo de café para no mirar todo revuelto.',
        target: '[data-kaffi="precios-filtros"]',
        cta: 'Mostrar filtros',
      },
      {
        text: 'Aquí abajo compare compradores y revise quién está pagando mejor antes de vender.',
        target: '[data-kaffi="precios-lista"]',
        cta: 'Ir a la lista',
      },
    ],
  },
  mapa: {
    id: 'mapa',
    title: 'Mapa de compradores',
    onboarding: true,
    intro: 'Este mapa le sirve para ubicar mejor a quien compra café.',
    steps: [
      {
        text: 'Aquí puede mirar la ubicación de compradores y comparar opciones según dónde le quede mejor.',
        target: null,
        cta: 'Entendido',
      },
    ],
  },
  predicciones: {
    id: 'predicciones',
    title: 'Predicciones',
    onboarding: true,
    intro: 'Esto le ayuda a ver una idea de cómo podría moverse el precio.',
    steps: [
      {
        text: 'No es una promesa exacta, pero sí una guía para tomar decisiones con más calma.',
        target: null,
        cta: 'Entendido',
      },
    ],
  },
  alertas: {
    id: 'alertas',
    title: 'Alertas',
    onboarding: true,
    intro: 'Aquí puede dejar avisos para no estar revisando a cada rato.',
    steps: [
      {
        text: 'Las alertas le ayudan a saber cuando el precio llega al punto que a usted le interesa.',
        target: null,
        cta: 'Entendido',
      },
    ],
  },
  dashboard_comprador: {
    id: 'dashboard_comprador',
    title: 'Panel del comprador',
    onboarding: true,
    intro: 'Este panel es su mesa de trabajo. Yo le voy guiando.',
    steps: [
      {
        text: 'Aquí puede ver cómo va su negocio frente al mercado y sus precios más recientes.',
        target: '[data-kaffi="dashboard-resumen"]',
        cta: 'Mostrar panel',
      },
      {
        text: 'En acciones rápidas está el botón para publicar un precio nuevo del día.',
        target: '[data-kaffi="dashboard-publicar"]',
        cta: 'Mostrar publicar',
      },
      {
        text: 'También puede duplicar el último precio o compartirlo cuando le convenga.',
        target: '[data-kaffi="dashboard-acciones"]',
        cta: 'Mostrar acciones',
      },
    ],
  },
  publicar_precio: {
    id: 'publicar_precio',
    title: 'Publicar precio',
    onboarding: false,
    intro: 'Listo, hagamos eso sin enredos.',
    steps: [
      {
        text: 'Primero abra el formulario para publicar precio. Si ya está abierto, seguimos de una.',
        target: '[data-kaffi="dashboard-publicar"]',
        cta: 'Abrir formulario',
        action: 'click',
      },
      {
        text: 'En este campo escriba el precio completo por carga, por ejemplo 1950000.',
        target: '[data-kaffi="precio-carga"]',
        cta: 'Ir al precio',
      },
      {
        text: 'Luego elija el tipo de café correcto para que el productor entienda bien la compra.',
        target: '[data-kaffi="precio-tipo"]',
        cta: 'Ir al tipo',
      },
      {
        text: 'Ya para terminar, pulse Publicar y su precio queda visible en la plataforma.',
        target: '[data-kaffi="precio-submit"]',
        cta: 'Mostrar publicar',
      },
    ],
  },
  perfil_productor: {
    id: 'perfil_productor',
    title: 'Perfil',
    onboarding: true,
    intro: 'Aquí es donde usted organiza sus datos personales.',
    steps: [
      {
        text: 'Mantener el perfil al día ayuda a que la plataforma le sirva mejor y muestre datos más claros.',
        target: null,
        cta: 'Entendido',
      },
    ],
  },
  perfil_comprador: {
    id: 'perfil_comprador',
    title: 'Perfil de empresa',
    onboarding: true,
    intro: 'Aquí completa la información de su negocio.',
    steps: [
      {
        text: 'Entre más claro deje el perfil del comprador, más confianza le transmite al productor.',
        target: null,
        cta: 'Entendido',
      },
    ],
  },
  admin: {
    id: 'admin',
    title: 'Panel administrativo',
    onboarding: true,
    intro: 'Aquí se revisan datos generales y configuraciones.',
    steps: [
      {
        text: 'Este panel es más de control y seguimiento general de la plataforma.',
        target: null,
        cta: 'Entendido',
      },
    ],
  },
};

export const PAGE_DEFAULT_GUIDE = {
  '/': 'home',
  '/register': 'register_productor',
  '/login': 'login',
  '/precios': 'precios_productor',
  '/mapa': 'mapa',
  '/predicciones': 'predicciones',
  '/alertas': 'alertas',
  '/perfil': 'perfil_productor',
  '/comprador/dashboard': 'dashboard_comprador',
  '/comprador/perfil': 'perfil_comprador',
  '/admin/perfil': 'admin',
  '/configuracion': 'admin',
};

export const PAGE_GUIDES = {
  '/': ['home'],
  '/register': ['register_productor', 'register_comprador'],
  '/login': ['login'],
  '/verify-email': ['verify_email'],
  '/precios': ['precios_productor'],
  '/mapa': ['mapa'],
  '/predicciones': ['predicciones'],
  '/alertas': ['alertas'],
  '/perfil': ['perfil_productor'],
  '/comprador/dashboard': ['dashboard_comprador', 'publicar_precio'],
  '/comprador/perfil': ['perfil_comprador'],
  '/admin/perfil': ['admin'],
  '/configuracion': ['admin'],
};

export const PAGE_ASSIST = {
  '/': {
    title: 'Qué puede hacer aquí',
    summary: 'Kaffi puede explicarle cómo funciona la plataforma, mostrarle precios y ayudarle a empezar.',
    actions: [
      { label: 'Explíqueme la plataforma', prompt: 'Explíqueme rápido para qué sirve esta plataforma.' },
      { label: 'Cómo registrarme', prompt: '¿Cómo me registro paso a paso?' },
      { label: 'Ver guía', guideId: 'home' },
    ],
  },
  '/login': {
    title: 'Ayuda para entrar',
    summary: 'Si no recuerda la contraseña o no sabe qué poner, Kaffi le guía paso a paso.',
    actions: [
      { label: 'Guiarme paso a paso', guideId: 'login' },
      { label: 'No recuerdo mi contraseña', prompt: 'No recuerdo mi contraseña. ¿Qué hago?' },
      { label: 'Qué necesito', prompt: '¿Qué necesito para iniciar sesión?' },
    ],
  },
  '/register': {
    title: 'Ayuda para registrarse',
    summary: 'Kaffi puede decirle qué tipo de cuenta le sirve y acompañarle campo por campo.',
    actions: [
      { label: 'Cuenta de productor', guideId: 'register_productor' },
      { label: 'Cuenta de comprador', guideId: 'register_comprador' },
      { label: 'Qué datos necesito', prompt: '¿Qué datos necesito para registrarme?' },
    ],
  },
  '/verify-email': {
    title: 'Ayuda con el código',
    summary: 'Si no llega el correo o no sabe qué sigue, Kaffi le explica sin enredos.',
    actions: [
      { label: 'Cómo verificar', guideId: 'verify_email' },
      { label: 'No me llegó el código', prompt: 'No me llegó el código al correo. ¿Qué hago?' },
      { label: 'Qué sigue después', prompt: '¿Qué pasa después de verificar el correo?' },
    ],
  },
  '/precios': {
    title: 'Ayuda para decidir',
    summary: 'Kaffi puede ayudarle a comparar compradores, leer la referencia FNC y decidir si conviene vender hoy.',
    actions: [
      { label: 'Leer esta pantalla', guideId: 'precios_productor' },
      { label: 'Quién paga mejor', prompt: 'Ayúdeme a entender quién está pagando mejor hoy.' },
      { label: 'Conviene vender hoy', prompt: 'Con esta pantalla, ¿qué debo mirar para saber si conviene vender hoy?' },
    ],
  },
  '/predicciones': {
    title: 'Ayuda para entender la predicción',
    summary: 'Kaffi le explica la confianza, la tendencia y cómo usar esto sin tomarlo como promesa.',
    actions: [
      { label: 'Qué significa esto', guideId: 'predicciones' },
      { label: 'Explíqueme la confianza', prompt: 'Explíqueme qué significa la confianza de la predicción.' },
      { label: 'Cómo decidir con esto', prompt: '¿Cómo uso esta predicción para decidir si vender o esperar?' },
    ],
  },
  '/alertas': {
    title: 'Ayuda con alertas',
    summary: 'Kaffi puede ayudarle a crear una alerta útil y a escoger un precio objetivo.',
    actions: [
      { label: 'Cómo funcionan', guideId: 'alertas' },
      { label: 'Qué precio poner', prompt: '¿Cómo elijo un buen precio para mi alerta?' },
      { label: 'Crear una alerta', prompt: 'Explíqueme cómo crear una alerta paso a paso.' },
    ],
  },
  '/comprador/dashboard': {
    title: 'Ayuda para publicar',
    summary: 'Kaffi puede mostrarle cómo usar el panel y cómo publicar precios sin perderse.',
    actions: [
      { label: 'Recorrer panel', guideId: 'dashboard_comprador' },
      { label: 'Publicar precio', guideId: 'publicar_precio' },
      { label: 'Qué sigue aquí', prompt: 'Estoy en el panel del comprador. ¿Qué me recomienda hacer primero?' },
    ],
  },
};

export const ONBOARDING_GUIDE_IDS = Object.values(KAFFI_GUIDES)
  .filter((guide) => guide.onboarding)
  .map((guide) => guide.id);

export const getGuidesForPath = (pathname) =>
  (PAGE_GUIDES[pathname] || []).map((id) => KAFFI_GUIDES[id]).filter(Boolean);

export const getAssistForPath = (pathname) => PAGE_ASSIST[pathname] || null;
