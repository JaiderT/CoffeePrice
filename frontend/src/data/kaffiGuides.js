export const KAFFI_GUIDES = {
  home: {
    id: "home",
    title: "Bienvenida",
    onboarding: true,
    intro: "Le muestro rapidito para que entienda de que va la plataforma.",
    steps: [
      {
        text: "Aqui puede mirar precios, ubicar compradores y aprender a moverse por CoffePrice.",
        target: null,
        cta: "Entendi",
      },
    ],
  },
  register_productor: {
    id: "register_productor",
    title: "Registro de productor",
    onboarding: true,
    intro: "Vamos suave. Yo le voy mostrando por donde seguir.",
    steps: [
      {
        text: "Primero deje marcada la opcion Productor. Esa es para quien vende su cafe.",
        target: '[data-kaffi="register-role-productor"]',
        cta: "Mostrar opcion",
      },
      {
        text: "Ahora llene nombre y apellido. Escribalos como aparecen normalmente.",
        target: '[data-kaffi="register-nombre"]',
        cta: "Ir al nombre",
      },
      {
        text: "Despues ponga un correo que si use, porque alli le llega la verificacion.",
        target: '[data-kaffi="register-email"]',
        cta: "Ir al correo",
      },
      {
        text: "Cree la contrasena y repitala igualita. Si puede, use letras y numeros para que quede mas segura.",
        target: '[data-kaffi="register-password"]',
        cta: "Ir a la contrasena",
      },
      {
        text: "Por ultimo pulse Crear cuenta. De ahi sigue la verificacion del correo.",
        target: '[data-kaffi="register-submit"]',
        cta: "Mostrar boton",
      },
    ],
  },
  register_comprador: {
    id: "register_comprador",
    title: "Registro de comprador",
    onboarding: true,
    intro: "Le acompano para dejar la cuenta lista y sin perderse.",
    steps: [
      {
        text: "Primero cambie a la opcion Comprador, porque esa cuenta es para publicar y manejar precios.",
        target: '[data-kaffi="register-role-comprador"]',
        cta: "Mostrar opcion",
      },
      {
        text: "Llene sus datos personales con calma. Nombre, apellido y correo son la base.",
        target: '[data-kaffi="register-nombre"]',
        cta: "Ir a los datos",
      },
      {
        text: "Despues cree la contrasena y repitala igual. Asi la cuenta queda protegida.",
        target: '[data-kaffi="register-password"]',
        cta: "Ir a la contrasena",
      },
      {
        text: "Cuando ya todo este bien, pulse Crear cuenta para seguir con la verificacion.",
        target: '[data-kaffi="register-submit"]',
        cta: "Mostrar boton",
      },
    ],
  },
  login: {
    id: "login",
    title: "Entrar a la cuenta",
    onboarding: true,
    intro: "Eso es cortico. Le voy mostrando paso por paso.",
    steps: [
      {
        text: "Primero escriba el correo con el que hizo el registro.",
        target: '[data-kaffi="login-email"]',
        cta: "Ir al correo",
      },
      {
        text: "Luego escriba la contrasena. Si no la ve bien, use el ojito para revisarla.",
        target: '[data-kaffi="login-password"]',
        cta: "Ir a la contrasena",
      },
      {
        text: "Cuando ya este todo, pulse Iniciar sesion.",
        target: '[data-kaffi="login-submit"]',
        cta: "Mostrar boton",
      },
    ],
  },
  precios_productor: {
    id: "precios_productor",
    title: "Mirar precios",
    onboarding: true,
    intro: "Aqui la idea es ayudarle a leer rapido quien paga mejor.",
    steps: [
      {
        text: "Arriba mire el mejor pago y el promedio. Eso le da una idea clara de como amanecio el mercado.",
        target: '[data-kaffi="precios-resumen"]',
        cta: "Mostrar resumen",
      },
      {
        text: "Si quiere encontrar algo mas facil, use la busqueda por nombre del comprador.",
        target: '[data-kaffi="precios-busqueda"]',
        cta: "Ir a la busqueda",
      },
      {
        text: "Tambien puede filtrar el tipo de cafe para no mirar todo revuelto.",
        target: '[data-kaffi="precios-filtros"]',
        cta: "Mostrar filtros",
      },
      {
        text: "Aqui abajo compare compradores y revise quien esta pagando mejor antes de vender.",
        target: '[data-kaffi="precios-lista"]',
        cta: "Ir a la lista",
      },
    ],
  },
  mapa: {
    id: "mapa",
    title: "Mapa de compradores",
    onboarding: true,
    intro: "Este mapa le sirve para ubicar mejor a quien compra cafe.",
    steps: [
      {
        text: "Aqui puede mirar la ubicacion de compradores y comparar opciones segun donde le quede mejor.",
        target: null,
        cta: "Entendi",
      },
    ],
  },
  predicciones: {
    id: "predicciones",
    title: "Predicciones",
    onboarding: true,
    intro: "Esto le ayuda a ver una idea de como podria moverse el precio.",
    steps: [
      {
        text: "No es una promesa exacta, pero si una guia para tomar decisiones con mas calma.",
        target: null,
        cta: "Entendi",
      },
    ],
  },
  alertas: {
    id: "alertas",
    title: "Alertas",
    onboarding: true,
    intro: "Aqui puede dejar avisos para no estar revisando a cada rato.",
    steps: [
      {
        text: "Las alertas le ayudan a saber cuando el precio llega al punto que a usted le interesa.",
        target: null,
        cta: "Entendi",
      },
    ],
  },
  dashboard_comprador: {
    id: "dashboard_comprador",
    title: "Panel del comprador",
    onboarding: true,
    intro: "Este panel es su mesa de trabajo. Yo le voy guiando.",
    steps: [
      {
        text: "Aqui puede ver como va su negocio frente al mercado y sus precios mas recientes.",
        target: '[data-kaffi="dashboard-resumen"]',
        cta: "Mostrar panel",
      },
      {
        text: "En acciones rapidas esta el boton para publicar un precio nuevo del dia.",
        target: '[data-kaffi="dashboard-publicar"]',
        cta: "Mostrar publicar",
      },
      {
        text: "Tambien puede duplicar el ultimo precio o compartirlo por WhatsApp cuando le convenga.",
        target: '[data-kaffi="dashboard-acciones"]',
        cta: "Mostrar acciones",
      },
    ],
  },
  publicar_precio: {
    id: "publicar_precio",
    title: "Publicar precio",
    onboarding: false,
    intro: "Listo, hagamos eso sin enredos.",
    steps: [
      {
        text: "Primero abra el formulario para publicar precio. Si ya esta abierto, seguimos de una.",
        target: '[data-kaffi="dashboard-publicar"]',
        cta: "Abrir formulario",
        action: "click",
      },
      {
        text: "En este campo escriba el precio completo por carga, por ejemplo 1950000.",
        target: '[data-kaffi="precio-carga"]',
        cta: "Ir al precio",
      },
      {
        text: "Luego elija el tipo de cafe correcto para que el productor entienda bien la compra.",
        target: '[data-kaffi="precio-tipo"]',
        cta: "Ir al tipo",
      },
      {
        text: "Ya para terminar, pulse Publicar y su precio queda visible en la plataforma.",
        target: '[data-kaffi="precio-submit"]',
        cta: "Mostrar publicar",
      },
    ],
  },
  perfil_productor: {
    id: "perfil_productor",
    title: "Perfil",
    onboarding: true,
    intro: "Aqui es donde usted organiza sus datos personales.",
    steps: [
      {
        text: "Mantener el perfil al dia ayuda a que la plataforma le sirva mejor y muestre datos mas claros.",
        target: null,
        cta: "Entendi",
      },
    ],
  },
  perfil_comprador: {
    id: "perfil_comprador",
    title: "Perfil de empresa",
    onboarding: true,
    intro: "Aqui completa la informacion de su negocio.",
    steps: [
      {
        text: "Entre mas claro deje el perfil del comprador, mas confianza le transmite al productor.",
        target: null,
        cta: "Entendi",
      },
    ],
  },
  admin: {
    id: "admin",
    title: "Panel administrativo",
    onboarding: true,
    intro: "Aqui se revisan datos generales y configuraciones.",
    steps: [
      {
        text: "Este panel es mas de control y seguimiento general de la plataforma.",
        target: null,
        cta: "Entendi",
      },
    ],
  },
};

export const PAGE_DEFAULT_GUIDE = {
  "/": "home",
  "/register": "register_productor",
  "/login": "login",
  "/precios": "precios_productor",
  "/mapa": "mapa",
  "/predicciones": "predicciones",
  "/alertas": "alertas",
  "/perfil": "perfil_productor",
  "/comprador/dashboard": "dashboard_comprador",
  "/comprador/perfil": "perfil_comprador",
  "/admin/perfil": "admin",
  "/configuracion": "admin",
};

export const PAGE_GUIDES = {
  "/": ["home"],
  "/register": ["register_productor", "register_comprador"],
  "/login": ["login"],
  "/precios": ["precios_productor"],
  "/mapa": ["mapa"],
  "/predicciones": ["predicciones"],
  "/alertas": ["alertas"],
  "/perfil": ["perfil_productor"],
  "/comprador/dashboard": ["dashboard_comprador", "publicar_precio"],
  "/comprador/perfil": ["perfil_comprador"],
  "/admin/perfil": ["admin"],
  "/configuracion": ["admin"],
};

export const ONBOARDING_GUIDE_IDS = Object.values(KAFFI_GUIDES)
  .filter((guide) => guide.onboarding)
  .map((guide) => guide.id);

export const getGuidesForPath = (pathname) =>
  (PAGE_GUIDES[pathname] || []).map((id) => KAFFI_GUIDES[id]).filter(Boolean);
