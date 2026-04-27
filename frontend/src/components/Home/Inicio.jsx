import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/useAuth.js';
import axios from 'axios';
function Inicio() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [precios, setPrecios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const guiaRef = useRef(null);
  const beneficiosRef = useRef(null);
  const { usuario } = useAuth();

  const [precioFNC, setPrecioFNC] = useState(null);
  const [fuenteFNC, setFuenteFNC] = useState(null);
  const [cargandoFNC, setCargandoFNC] = useState(true);

  const [reseñas, setReseñas] = useState([]);
  const [reseñasVisibles, setReseñasVisibles] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevaReseña, setNuevaReseña] = useState({
    calificacion: 0,
    comentario: '',
    lugar: '',
  });
  const [hover, setHover] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [mensajeReseña, setMensajeReseña] = useState(null);
  const [preguntaAbierta, setPreguntaAbierta] = useState(null);

  const rutaPanel = usuario
    ? usuario.rol === 'admin'
      ? '/admin/perfil'
      : usuario.rol === 'comprador'
      ? '/comprador/dashboard'
      : '/perfil'
    : '/register';

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const [preciosRes, resenasRes, fncRes] = await Promise.all([
          axios.get(`${API_URL}/api/precios`),
          axios.get(`${API_URL}/api/resenas-plataforma`),
          axios.get(`${API_URL}/api/precio-fnc`),
        ]);
        setPrecios(preciosRes.data);
        setReseñas(resenasRes.data);
        if (fncRes.data?.precio) {
          setPrecioFNC(fncRes.data.precio);
          setFuenteFNC(fncRes.data.fuente);
        }
      } catch (error) {
        console.error('Error al obtener datos de inicio:', error);
      } finally {
        setCargando(false);
        setCargandoFNC(false);
      }
    };
    obtenerDatos();
  }, [API_URL]);

  useEffect(() => {
    if (reseñas.length <= 3) {
      setReseñasVisibles(reseñas);
      return;
    }
    const seleccionar = () => {
      const mezcladas = [...reseñas].sort(() => Math.random() - 0.5);
      setReseñasVisibles(mezcladas.slice(0, 3));
    };
    seleccionar();
    const intervalo = setInterval(seleccionar, 8000);
    return () => clearInterval(intervalo);
  }, [reseñas]);

  const handleEnviarReseña = async (e) => {
    e.preventDefault();
    if (nuevaReseña.calificacion === 0) {
      setMensajeReseña({ tipo: 'error', texto: 'Debes seleccionar una calificación' });
      setTimeout(() => setMensajeReseña(null), 3000);
      return;
    }
    setEnviando(true);
    try {
      await axios.post(`${API_URL}/api/resenas-plataforma`, nuevaReseña, {
        withCredentials: true,
      });
      setMensajeReseña({ tipo: 'exito', texto: 'Gracias. Tu reseña está pendiente de aprobación.' });
      setNuevaReseña({ calificacion: 0, comentario: '', lugar: '' });
      setMostrarFormulario(false);
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al enviar la reseña';
      setMensajeReseña({ tipo: 'error', texto: msg });
    } finally {
      setEnviando(false);
      setTimeout(() => setMensajeReseña(null), 4000);
    }
  };

  const scrollTo = (ref) => {
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const renderEstrellas = (n) =>
    '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  const medallas = ['🥇', '🥈', '🥉', '🏅', '🏅'];

  const reseñasMostrar =
    reseñasVisibles.length > 0
      ? reseñasVisibles
      : [
          {
            calificacion: 5,
            comentario: 'Antes me tocaba salir temprano a preguntar en varias compras. Ahora miro primero en el celular y salgo con una idea clara.',
            usuario: { nombre: 'Jaider', apellido: 'Muñoz' },
            lugar: 'Caficultor · Pitalito, Huila',
          },
          {
            calificacion: 5,
            comentario: 'La alerta de precio me ayudó a vender mejor. Ese día sí sentí que estaba tomando la decisión con más información.',
            usuario: { nombre: 'María', apellido: 'Ospina' },
            lugar: 'Caficultora · Acevedo, Huila',
          },
          {
            calificacion: 4,
            comentario: 'Es fácil de usar y me evita ir a ciegas. Uno ya sabe quién está pagando mejor antes de salir.',
            usuario: { nombre: 'Ernesto', apellido: 'Vargas' },
            lugar: 'Caficultor · La Argentina, Huila',
          },
        ];

  const pasos = [
    {
      paso: '01',
      icono: '📊',
      titulo: 'Compara los precios del día',
      desc: 'Mira en una sola pantalla qué compradores están activos hoy y cuánto están pagando por carga y por kilo.',
      detalle: 'Los precios se actualizan a lo largo del día. Puedes ver el precio por carga, precio por kilo y la variación respecto al día anterior.',
    },
    {
      paso: '02',
      icono: '🔔',
      titulo: 'Activa tu alerta de precio',
      desc: 'Dile a la plataforma a qué precio quieres vender y te avisamos cuando algún comprador alcance ese valor.',
      detalle: 'Esta función requiere cuenta gratuita. Una vez configurada, recibirás una notificación para que no se te pase la oportunidad.',
    },
    {
      paso: '03',
      icono: '📈',
      titulo: 'Mira la predicción del mercado',
      desc: 'Revisa si se espera que el precio suba, baje o se mantenga para el día siguiente según el comportamiento reciente.',
      detalle: 'La predicción es una referencia basada en datos históricos. No es una garantía, pero te da una señal para decidir si esperar o vender hoy.',
    },
    {
      paso: '04',
      icono: '✅',
      titulo: 'Decide con más información',
      desc: 'Con todos estos datos en la mano, ya puedes salir a vender sabiendo a quién ir y si el momento es bueno.',
      detalle: 'Muchos caficultores ya ahorraron tiempo y viajes innecesarios. La información es gratis y está disponible todos los días.',
    },
  ];

  const beneficios = [
    {
      icono: '⏱️',
      titulo: 'Ahorra tiempo',
      desc: 'Ya no tienes que ir físicamente a preguntar precios en cada compra. Con un par de clics sabes el panorama completo.',
    },
    {
      icono: '💰',
      titulo: 'Vende al mejor precio',
      desc: 'Al comparar varios compradores, puedes elegir al que mejor paga ese día. Esa diferencia puede ser significativa en una carga.',
    },
    {
      icono: '📱',
      titulo: 'Funciona desde el celular',
      desc: 'Diseñado para usarse desde el teléfono en el campo. No necesitas computador ni conocimientos técnicos.',
    },
    {
      icono: '🆓',
      titulo: 'Completamente gratis',
      desc: 'Para los caficultores no tiene ningún costo. La consulta de precios es libre, y la cuenta también es gratuita.',
    },
    {
      icono: '📍',
      titulo: 'Información local',
      desc: 'Los precios son de compradores reales en tu zona, no promedios nacionales. Lo que ves es lo que hay en tu municipio.',
    },
    {
      icono: '🔄',
      titulo: 'Siempre actualizado',
      desc: 'Los compradores actualizan sus precios durante el día. Tú siempre ves la información más reciente disponible.',
    },
  ];

  const faqs = [
    {
      pregunta: '¿Necesito crear una cuenta para ver los precios?',
      respuesta: 'No. Puedes consultar los precios del día sin registrarte. La cuenta gratuita desbloquea funciones adicionales como alertas de precio, historial y predicciones detalladas.',
    },
    {
      pregunta: '¿Con qué frecuencia se actualizan los precios?',
      respuesta: 'Los compradores pueden actualizar sus precios en cualquier momento del día. En general, los precios se renuevan cada mañana y pueden cambiar a lo largo del día según el mercado.',
    },
    {
      pregunta: '¿CoffePrice cobra algo a los caficultores?',
      respuesta: 'No. Para los caficultores el servicio es completamente gratuito, tanto la consulta de precios como el registro de cuenta.',
    },
    {
      pregunta: '¿En qué municipios está disponible?',
      respuesta: 'Actualmente tenemos cobertura en 12 municipios del Huila. Estamos trabajando para expandirnos a más zonas cafeteras del país.',
    },
    {
      pregunta: '¿Cómo sé que los precios son reales?',
      respuesta: 'Los precios son publicados directamente por los compradores registrados en la plataforma. Cada publicación tiene fecha y hora para que puedas verificar su vigencia.',
    {
      pregunta: '¿Qué es la predicción de precios?',
      respuesta: 'Es una estimación basada en el comportamiento reciente del mercado local que te indica si el precio tiene tendencia a subir, bajar o mantenerse. Es una referencia, no una garantía.',
    },
  ];

  return (
    <div className="w-full bg-[linear-gradient(180deg,#F3E9DA_0%,#F7F2E8_42%,#EEE1CE_100%)]">

      {/* ── HERO ── */}
      <section className="px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#3A281C_0%,#5A3E2C_60%,#7A573D_100%)] px-5 py-6 text-[#FBF5EC] shadow-[0_28px_70px_rgba(58,40,28,0.22)] md:px-8 md:py-8 xl:px-10">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:gap-8">
              <div className="max-w-2xl">
                <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#E8D8C5]">
                  Hecho para caficultores
                </span>

                <h1 className="mt-4 text-3xl font-black leading-tight md:text-4xl xl:text-5xl">
                  Revisa cómo está el precio del café antes de salir a vender
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#E9DDD0] md:text-base">
                  Mira quién está pagando mejor en tu zona, compara compradores y toma la decisión con más calma y más claridad.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    to="/precios"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#E1BE86] px-5 py-3 text-sm font-semibold text-[#2E2118] transition hover:bg-[#E9C996]"
                  >
                    Ver precios ahora
                  </Link>

                  {usuario ? (
                    <Link
                      to={rutaPanel}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Ir a mi panel
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={() => scrollTo(guiaRef)}
                        className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Cómo funciona
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:max-w-xl">
                  <div className="rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
                    <p className="text-xl font-black text-white">+240</p>
                    <p className="mt-1 text-[11px] text-[#D8CBBB]">Compradores registrados</p>
                  </div>
                  <div className="rounded-2xl bg-[#E1BE86] px-4 py-4 text-[#2E2118]">
                    <p className="text-xl font-black">Gratis</p>
                    <p className="mt-1 text-[11px] text-[#6F4E31]">Para caficultores</p>
                  </div>
                </div>
              </div>

              <div className="flex">
                <div className="w-full rounded-[30px] bg-[linear-gradient(180deg,#FBF4EA_0%,#F3E5D2_100%)] p-4 text-[#2F241C] shadow-[0_16px_40px_rgba(0,0,0,0.14)] md:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A735B]">
                        🏛️ Precio FNC hoy
                      </p>
                      <h2 className="mt-2 text-2xl font-black md:text-3xl">
                        {cargandoFNC
                          ? '...'
                          : precioFNC
                          ? `$${precioFNC.toLocaleString('es-CO')}`
                          : `$${precios[0]?.preciocarga?.toLocaleString() || '1.950.000'}`}
                      </h2>
                      <p className="mt-1 text-sm text-[#6D5E53]">
                        Precio de referencia por carga · FNC
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#EAF2E1] px-3 py-2 sm:text-right">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[#5D7040]">Fuente</p>
                      <p className="mt-1 text-sm font-bold text-[#41592A]">
                        {cargandoFNC
                          ? '...'
                          : fuenteFNC === 'fnc-directo'
                          ? 'FNC directa'
                          : 'Est. mercado NY'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl bg-[#F8EEDB] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A735B]">
                      Mejores pagos del día
                    </p>

                    <div className="mt-3 relative">
                      {cargando ? (
                        <p className="py-3 text-sm text-[#7B6A5C]">Cargando precios...</p>
                      ) : usuario ? (
                        /* ── Usuario logueado: muestra todo normalmente ── */
                        <div className="space-y-3">
                          {precios.slice(0, 4).map((item, i) => (
                            <div key={i} className="rounded-2xl bg-white/85 px-4 py-4 shadow-[0_6px_14px_rgba(96,73,47,0.05)]">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-3">
                                  <span className="mt-0.5 shrink-0 text-lg">{medallas[i]}</span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-[#2F241C]">
                                      {item.comprador?.nombreempresa}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-[#8B7A69]">
                                      {item.comprador?.direccion || 'Dirección disponible en precios'}
                                    </p>
                                  </div>
                                </div>
                                <span className="shrink-0 text-sm font-black text-[#2F241C]">
                                  ${item.preciocarga?.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* ── Sin sesión: 3 visibles + el resto tapado ── */
                        <div>
                          {/* Primeras 3 filas visibles */}
                          <div className="space-y-3">
                            {precios.slice(0, 3).map((item, i) => (
                              <div key={i} className="rounded-2xl bg-white/85 px-4 py-4 shadow-[0_6px_14px_rgba(96,73,47,0.05)]">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex min-w-0 items-start gap-3">
                                    <span className="mt-0.5 shrink-0 text-lg">{medallas[i]}</span>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-bold text-[#2F241C]">
                                        {item.comprador?.nombreempresa}
                                      </p>
                                      <p className="mt-1 truncate text-xs text-[#8B7A69]">
                                        {item.comprador?.direccion || 'Dirección disponible al iniciar sesión'}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="shrink-0 text-sm font-black text-[#2F241C]">
                                    ${item.preciocarga?.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Filas tapadas con overlay (a partir de la 4ta) */}
                          <div className="relative mt-3">
                            {/* Filas borrosas decorativas */}
                            <div className="space-y-3 blur-sm pointer-events-none select-none">
                              {precios.slice(3, 5).map((item, i) => (
                                <div key={i} className="rounded-2xl bg-white/85 px-4 py-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-start gap-3">
                                      <span className="mt-0.5 shrink-0 text-lg">{medallas[i + 3] ?? '🏅'}</span>
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-[#2F241C]">
                                          {item.comprador?.nombreempresa}
                                        </p>
                                        <p className="mt-1 truncate text-xs text-[#8B7A69]">
                                          {item.comprador?.direccion || '—'}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="shrink-0 text-sm font-black text-[#2F241C]">
                                      ${item.preciocarga?.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Overlay con CTA encima de las filas tapadas */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#2F241C]/65 px-4 text-center">
                              <p className="text-sm font-bold text-white">
                                Ver todos los compradores
                              </p>
                              <p className="text-xs text-[#E8D8C5]">
                                Inicia sesión para ver la lista completa
                              </p>
                              <div className="mt-1 flex gap-2">
                                <Link
                                  to="/login"
                                  className="rounded-xl bg-[#E1BE86] px-4 py-2 text-xs font-semibold text-[#2E2118] transition hover:bg-[#E9C996]"
                                >
                                  Iniciar sesión
                                </Link>
                                <Link
                                  to="/register"
                                  className="rounded-xl border border-white/30 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                                >
                                  Registrarme
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl bg-[linear-gradient(135deg,#2F241C_0%,#453126_100%)] p-4 text-[#F7F1E8]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#D9C9AF]">Lo importante</p>
                    <p className="mt-2 text-base font-black md:text-lg">
                      Hoy sí vale la pena mirar antes de vender
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[#E5D8C8]">
                      Entra al comparador y revisa con calma quién está pagando mejor en tu municipio.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 rounded-[26px] bg-white/5 p-4 backdrop-blur-sm lg:grid-cols-3">
              <div className="rounded-[22px] bg-white/6 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#D9C9AF]">Consulta rápida</p>
                <p className="mt-2 text-lg font-black text-white">Mira el mejor pago del día</p>
                <p className="mt-1 text-sm text-[#E6D8C8]">
                  Sin complicarte, en pocos segundos sabes cómo está el mercado.
                </p>
              </div>
              <div className="rounded-[22px] bg-white/6 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#D9C9AF]">Compara tranquilo</p>
                <p className="mt-2 text-lg font-black text-white">Revisa varios compradores</p>
                <p className="mt-1 text-sm text-[#E6D8C8]">
                  Compara antes de moverte y evita vender sin referencia.
                </p>
              </div>
              <div className="rounded-[22px] bg-white/6 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#D9C9AF]">Decide mejor</p>
                <p className="mt-2 text-lg font-black text-white">Apóyate en la predicción</p>
                <p className="mt-1 text-sm text-[#E6D8C8]">
                  Mira si mañana podría subir, bajar o seguir parecido.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BANNER INFORMATIVO (solo no logueados) ── */}
      {!usuario && (
        <section className="px-4 py-4 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#E1BE86]/40 bg-[#FFF8EC] px-5 py-4 text-center md:flex-row md:text-left">
              <span className="text-2xl">☕</span>
              <p className="flex-1 text-sm text-[#5E4B3A]">
                <span className="font-bold text-[#3A281C]">¿Es tu primera vez aquí?</span>{' '}
                No necesitas cuenta para ver los precios. Pero si te registras (gratis), puedes activar alertas, ver historial y acceder a la predicción detallada.
              </p>
              <Link
                to="/register"
                className="shrink-0 rounded-xl bg-[#3A281C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A3E2C]"
              >
                Registrarme gratis
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── ¿QUÉ ES COFFEPRICE? ── */}
      {!usuario && (
        <section className="px-4 py-8 md:px-8 md:py-10">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[30px] bg-white px-6 py-8 shadow-[0_12px_30px_rgba(110,86,60,0.08)] ring-1 ring-[#E7D7BF] md:px-10 md:py-10">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 lg:items-center">
                <div>
                  <span className="inline-flex rounded-full bg-[#F3E5CE] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A5428]">
                    ¿Qué es CoffePrice?
                  </span>
                  <h2 className="mt-4 text-2xl font-black text-[#2F241C] md:text-3xl">
                    Una herramienta hecha para que los caficultores vendan mejor
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-[#5E4B3A] md:text-base">
                    CoffePrice es una plataforma gratuita que reúne los precios de los compradores de café de tu zona en un solo lugar. En lugar de salir a preguntar de puerta en puerta, puedes revisar desde el celular quién está pagando mejor ese día antes de moverte.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#5E4B3A] md:text-base">
                    También puedes ver la tendencia del mercado, activar alertas cuando el precio llegue al valor que quieres, y comparar compradores por municipio. Todo pensado para que tomes decisiones con más información y menos incertidumbre.
                  </p>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    <Link
                      to="/precios"
                      className="inline-flex items-center justify-center rounded-2xl bg-[#2F241C] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#463227]"
                    >
                      Ver precios sin cuenta
                    </Link>
                    <button
                      onClick={() => scrollTo(guiaRef)}
                      className="inline-flex items-center justify-center rounded-2xl border border-[#C8A96E] px-6 py-3 text-sm font-semibold text-[#2F241C] transition hover:bg-[#FFF8E7]"
                    >
                      Ver guía paso a paso
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icono: '👀', titulo: 'Sin cuenta', desc: 'Consulta precios del día sin registrarte' },
                    { icono: '🔔', titulo: 'Alertas', desc: 'Te avisamos cuando llegue a tu precio objetivo' },
                    { icono: '📈', titulo: 'Predicción', desc: 'Señal de si el precio subirá o bajará mañana' },
                    { icono: '🏪', titulo: 'Compradores reales', desc: 'Negocios registrados y verificados de tu zona' },
                    { icono: '📅', titulo: 'Historial', desc: 'Mira cómo ha estado el precio las últimas semanas' },
                    { icono: '📍', titulo: 'Por municipio', desc: 'Filtra por tu zona para ver solo lo relevante' },
                  ].map((f, i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-[#FBF5EC] p-4 ring-1 ring-[#EDD9BF]"
                    >
                      <span className="text-xl">{f.icono}</span>
                      <p className="mt-2 text-sm font-bold text-[#2F241C]">{f.titulo}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[#7A6B5F]">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── GUÍA PASO A PASO ── */}
      <section ref={guiaRef} className="px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[30px] bg-[#F7EFE3] px-5 py-8 shadow-[0_12px_30px_rgba(110,86,60,0.08)] ring-1 ring-[#E7D7BF] md:px-8 md:py-10">
            <div className="text-center">
              <span className="inline-flex rounded-full bg-[#EDD9BF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A5428]">
                Guía paso a paso
              </span>
              <h2 className="mt-3 text-2xl font-black text-[#2F241C] md:text-3xl">
                Así funciona CoffePrice
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#6D5E53]">
                En cinco pasos simples puedes pasar de no saber nada a tener toda la información para vender mejor.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {pasos.map((item, i) => (
                <div
                  key={i}
                  className="group rounded-3xl bg-white px-5 py-5 shadow-[0_8px_20px_rgba(96,73,47,0.07)] ring-1 ring-[#E7D7BF] transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#3A281C] text-xl text-white shadow-md">
                      {item.icono}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B78E59]">
                            Paso {item.paso}
                          </span>
                          <h3 className="text-base font-black text-[#2F241C] md:text-lg">
                            {item.titulo}
                          </h3>
                        </div>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-[#5E4B3A]">
                        {item.desc}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-[#8B7A69] border-l-2 border-[#E1BE86] pl-3">
                        {item.detalle}
                      </p>
                    </div>
                    {i < pasos.length - 1 && (
                      <div className="hidden sm:flex shrink-0 items-center text-[#D9C9AF]">
                        <span className="text-lg">→</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[22px] bg-[linear-gradient(135deg,#3A281C_0%,#5A3E2C_100%)] p-5 text-center text-[#FBF5EC]">
              <p className="text-base font-black md:text-lg">
                ¿Listo para empezar? Es gratis y no toma más de 2 minutos.
              </p>
              <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/precios"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#E1BE86] px-6 py-3 text-sm font-semibold text-[#2E2118] transition hover:bg-[#E9C996]"
                >
                  Ver precios ahora (sin cuenta)
                </Link>
                {!usuario && (
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Crear cuenta gratis
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS (solo no logueados) ── */}
      {!usuario && (
        <section ref={beneficiosRef} className="px-4 py-8 md:px-8 md:py-10">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <span className="inline-flex rounded-full bg-[#EDD9BF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A5428]">
                ¿Por qué usarla?
              </span>
              <h2 className="mt-3 text-2xl font-black text-[#2F241C] md:text-3xl">
                Lo que ganas al consultar antes de vender
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#6D5E53]">
                No es solo ver un número. Es tener una ventaja real al momento de negociar tu café.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {beneficios.map((b, i) => (
                <div
                  key={i}
                  className="rounded-[26px] bg-white p-5 shadow-[0_10px_24px_rgba(96,73,47,0.07)] ring-1 ring-[#E7D7BF]"
                >
                  <span className="text-3xl">{b.icono}</span>
                  <h3 className="mt-3 text-base font-black text-[#2F241C]">{b.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6D5E53]">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── DIFERENCIA GRATUITO VS CUENTA ── */}
      {!usuario && (
        <section className="px-4 py-8 md:px-8 md:py-10">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <span className="inline-flex rounded-full bg-[#EDD9BF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A5428]">
                Cuenta gratuita vs. sin cuenta
              </span>
              <h2 className="mt-3 text-2xl font-black text-[#2F241C] md:text-3xl">
                ¿Qué cambia si me registro?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#6D5E53]">
                Puedes consultar precios sin registrarte. Pero con cuenta tienes acceso a más herramientas, todas gratis.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:max-w-3xl md:mx-auto">
              {/* Sin cuenta */}
              <div className="rounded-[26px] bg-[#F9F5EE] p-5 ring-1 ring-[#E7D7BF]">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A735B]">Sin cuenta</p>
                <p className="mt-1 text-lg font-black text-[#2F241C]">Consulta básica</p>
                <ul className="mt-4 space-y-3 text-sm text-[#5E4B3A]">
                  {[
                    '✅ Ver precios del día por municipio',
                    '✅ Comparar compradores activos',
                    '✅ Ver precio por carga y por kilo',
                    '❌ Alertas de precio',
                    '❌ Historial de precios',
                    '❌ Predicción detallada',
                    '❌ Favoritos y notas',
                  ].map((item, i) => (
                    <li key={i} className={item.startsWith('❌') ? 'opacity-40' : ''}>{item}</li>
                  ))}
                </ul>
                <Link
                  to="/precios"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-[#C8A96E] py-3 text-sm font-semibold text-[#2F241C] transition hover:bg-[#FFF8E7]"
                >
                  Ver precios sin registrarme
                </Link>
              </div>

              {/* Con cuenta */}
              <div className="rounded-[26px] bg-[linear-gradient(135deg,#3A281C_0%,#5A3E2C_100%)] p-5 text-[#FBF5EC] shadow-[0_16px_40px_rgba(58,40,28,0.2)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#D9C9AF]">Con cuenta gratuita</p>
                <p className="mt-1 text-lg font-black text-white">Todas las funciones</p>
                <ul className="mt-4 space-y-3 text-sm text-[#E8D8C5]">
                  {[
                    '✅ Ver precios del día por municipio',
                    '✅ Comparar compradores activos',
                    '✅ Ver precio por carga y por kilo',
                    '✅ Alertas de precio personalizadas',
                    '✅ Historial de precios recientes',
                    '✅ Predicción detallada del mercado',
                    '✅ Favoritos y notas personales',
                  ].map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#E1BE86] py-3 text-sm font-semibold text-[#2E2118] transition hover:bg-[#E9C996]"
                >
                  Crear mi cuenta gratis
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── RESEÑAS ── */}
      <section className="px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="inline-flex rounded-full bg-[#EDD9BF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A5428]">
              Lo que dicen los caficultores
            </span>
            <h2 className="mt-3 text-2xl font-black text-[#2F241C] md:text-3xl">
              Voces del campo
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#6D5E53]">
              Caficultores que ya usan CoffePrice para revisar el mercado antes de vender.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reseñasMostrar.map((item, i) => (
              <div key={i} className="rounded-[26px] bg-[#FCF7F0] p-5 shadow-[0_12px_24px_rgba(96,73,47,0.06)] ring-1 ring-[#E7D7BF]">
                <p className="text-lg text-[#C8A96E]">{renderEstrellas(item.calificacion)}</p>
                <p className="mt-4 text-sm leading-relaxed text-[#5F5247]">"{item.comentario}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DDBA83] text-sm font-bold text-white">
                    {item.usuario?.nombre?.[0]}{item.usuario?.apellido?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2F241C]">
                      {item.usuario?.nombre} {item.usuario?.apellido}
                    </p>
                    <p className="text-xs text-[#8B7A69]">{item.lugar || 'Caficultor · Colombia'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-8 max-w-xl">
            {mensajeReseña && (
              <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${mensajeReseña.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {mensajeReseña.texto}
              </div>
            )}

            {!mostrarFormulario ? (
              usuario ? (
                <div className="text-center">
                  <button
                    onClick={() => setMostrarFormulario(true)}
                    className="inline-flex rounded-2xl border border-[#C8A96E] bg-white px-6 py-3 text-sm font-semibold text-[#2F241C] transition hover:bg-[#FFF8E7]"
                  >
                    Dejar mi reseña sobre CoffePrice
                  </button>
                </div>
              ) : (
                <p className="text-center text-sm text-[#7A6B5F]">
                  <Link to="/login" className="font-semibold text-[#B78E59] hover:underline">
                    Inicia sesión
                  </Link>{' '}
                  para dejar tu reseña
                </p>
              )
            ) : (
              <div className="rounded-[26px] border border-[#E7D9BF] bg-white p-5 shadow-[0_12px_24px_rgba(96,73,47,0.06)]">
                <h3 className="text-base font-black text-[#2F241C]">
                  ¿Cómo ha sido tu experiencia con CoffePrice?
                </h3>
                <form onSubmit={handleEnviarReseña} className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase text-[#8B7355]">Calificación</p>
                  <div className="mb-4 flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNuevaReseña({ ...nuevaReseña, calificacion: n })}
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(0)}
                        className={`h-10 w-10 rounded-xl border text-lg transition-all ${(hover || nuevaReseña.calificacion) >= n ? 'border-[#C8A96E] bg-[#FFF8E7] text-[#C8A96E]' : 'border-gray-200 bg-white text-gray-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <p className="mb-2 text-xs font-semibold uppercase text-[#8B7355]">Tu experiencia</p>
                  <textarea
                    required
                    value={nuevaReseña.comentario}
                    onChange={(e) => setNuevaReseña({ ...nuevaReseña, comentario: e.target.value })}
                    placeholder="Cuéntanos cómo te ha ayudado CoffePrice..."
                    className="mb-4 h-24 w-full resize-none rounded-xl border border-gray-200 bg-[#F7F1E3] px-4 py-3 text-sm text-[#2C1A0E] placeholder-gray-400 focus:border-[#C8A96E] focus:outline-none"
                  />
                  <p className="mb-2 text-xs font-semibold uppercase text-[#8B7355]">Tu ubicación (opcional)</p>
                  <input
                    type="text"
                    value={nuevaReseña.lugar}
                    onChange={(e) => setNuevaReseña({ ...nuevaReseña, lugar: e.target.value })}
                    placeholder="Ej: Caficultor · Pitalito, Huila"
                    className="mb-4 w-full rounded-xl border border-gray-200 bg-[#F7F1E3] px-4 py-3 text-sm text-[#2C1A0E] placeholder-gray-400 focus:border-[#C8A96E] focus:outline-none"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setMostrarFormulario(false)}
                      className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={enviando}
                      className="flex-1 rounded-xl bg-[#2C1A0E] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3D1F0F] disabled:opacity-60"
                    >
                      {enviando ? 'Enviando...' : 'Enviar reseña'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── PREGUNTAS FRECUENTES (solo no logueados) ── */}
      {!usuario && (
        <section className="px-4 py-8 md:px-8 md:py-10">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <span className="inline-flex rounded-full bg-[#EDD9BF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A5428]">
                Preguntas frecuentes
              </span>
              <h2 className="mt-3 text-2xl font-black text-[#2F241C] md:text-3xl">
                Resolvemos tus dudas
              </h2>
            </div>

            <div className="mt-8 space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-[20px] bg-white ring-1 ring-[#E7D7BF] overflow-hidden shadow-[0_6px_16px_rgba(96,73,47,0.06)]"
                >
                  <button
                    onClick={() => setPreguntaAbierta(preguntaAbierta === i ? null : i)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="text-sm font-bold text-[#2F241C] pr-4">{faq.pregunta}</span>
                    <span className={`shrink-0 text-[#B78E59] transition-transform duration-200 ${preguntaAbierta === i ? 'rotate-45' : ''}`}>
                      ＋
                    </span>
                  </button>
                  {preguntaAbierta === i && (
                    <div className="border-t border-[#EDD9BF] px-5 py-4">
                      <p className="text-sm leading-relaxed text-[#5E4B3A]">{faq.respuesta}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA FINAL ── */}
      <section className="px-4 py-8 md:px-8 md:pb-14">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-[linear-gradient(135deg,#DDBA83_0%,#E9D3A9_52%,#F4E7D0_100%)] px-5 py-10 text-center text-[#2F241C] shadow-[0_18px_40px_rgba(125,90,45,0.12)] md:px-8 md:py-12">
            <h2 className="text-3xl font-black leading-tight md:text-4xl">
              Consulta el mercado con más calma antes de vender
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#5E4B3A] md:text-base">
              Revisa precios, compara compradores y apóyate en una referencia más clara antes de tomar una decisión. Todo gratis, desde el celular.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              {usuario ? (
                <Link
                  to={rutaPanel}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#2F241C] px-7 py-3 font-semibold text-white transition hover:bg-[#463227]"
                >
                  Ir a mi panel
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#2F241C] px-7 py-3 font-semibold text-white transition hover:bg-[#463227]"
                  >
                    Crear cuenta gratis
                  </Link>
                  <Link
                    to="/precios"
                    className="inline-flex items-center justify-center rounded-2xl border border-[#7A5A38] px-7 py-3 font-semibold text-[#2F241C] transition hover:bg-white/30"
                  >
                    Ver precios sin registrarse
                  </Link>
                </>
              )}
            </div>

            {!usuario && (
              <p className="mt-4 text-xs text-[#7A6B5F]">
                Sin tarjeta de crédito · Sin spam · 100% gratuito para caficultores
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Inicio;