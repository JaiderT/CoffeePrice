import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { KAFFI_GUIDES, getAssistForPath, getGuidesForPath } from '../data/kaffiGuides';
import { useAuth } from '../context/useAuth.js';

const MENSAJE_INICIAL =
  'Buenas. Soy Kaffi y estoy para ayudarle con la plataforma sin enredos.';

const STORAGE_PINNED = 'kaffi_panel_pinned';
const HIGHLIGHT_CLASS =
  'ring-4 ring-[#C8A96E] ring-offset-4 ring-offset-[#FFF8EC] shadow-[0_0_0_6px_rgba(200,169,110,0.20)]';
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
  /\bcallate\b/,
  /\bno sirves\b/,
  /\bque inutil\b/,
];

function leerBooleano(key, fallback = false) {
  const value = localStorage.getItem(key);
  return value == null ? fallback : value === 'true';
}

function normalizarTexto(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function esLenguajeOfensivo(value = '') {
  const texto = normalizarTexto(value);
  return PATRONES_OFENSIVOS.some((patron) => patron.test(texto));
}

function leerDatosPaginaKaffi() {
  if (typeof window === 'undefined') return null;
  return window.__kaffiPageData || null;
}

export default function Kaffi() {
  const API_URL = import.meta.env.VITE_API_URL;
  const location = useLocation();
  const { usuario } = useAuth();
  const finRef = useRef(null);
  const targetRef = useRef(null);

  const [chatAbierto, setChatAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([{ role: 'assistant', content: MENSAJE_INICIAL }]);
  const [entrada, setEntrada] = useState('');
  const [cargando, setCargando] = useState(false);
  const [sugerencias, setSugerencias] = useState([]);
  const [guiaActivaId, setGuiaActivaId] = useState(null);
  const [pasoActual, setPasoActual] = useState(0);
  const [panelFijado, setPanelFijado] = useState(() => leerBooleano(STORAGE_PINNED));

  const guiasPagina = useMemo(() => getGuidesForPath(location.pathname), [location.pathname]);
  const ayudaPagina = useMemo(() => getAssistForPath(location.pathname), [location.pathname]);

  const guiaActiva = guiaActivaId ? KAFFI_GUIDES[guiaActivaId] : null;
  const paso = guiaActiva?.steps?.[pasoActual] || null;
  const esUltimoPaso = guiaActiva && pasoActual === guiaActiva.steps.length - 1;

  const limpiarResaltado = useCallback(() => {
    if (targetRef.current) {
      targetRef.current.classList.remove(...HIGHLIGHT_CLASS.split(' '));
      targetRef.current = null;
    }
  }, []);

  const iniciarGuia = useCallback((guideId) => {
    const guia = KAFFI_GUIDES[guideId];
    if (!guia) return;

    limpiarResaltado();
    setGuiaActivaId(guideId);
    setPasoActual(0);
    setChatAbierto(true);
    setMensajes((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: `Le ayudo con "${guia.title}". ${guia.intro}`,
      },
    ]);
  }, [limpiarResaltado]);

  useEffect(() => {
    if (chatAbierto) {
      finRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatAbierto, mensajes, sugerencias, guiaActivaId, pasoActual]);

  useEffect(() => () => limpiarResaltado(), [limpiarResaltado]);

  useEffect(() => {
    const acciones = ayudaPagina?.actions?.map((accion) => accion.label) || [];
    const guias = guiasPagina.map((guia) => guia.title);
    setSugerencias(acciones.length > 0 ? acciones : guias);
    setGuiaActivaId(null);
    setPasoActual(0);
    limpiarResaltado();
  }, [location.pathname, ayudaPagina, guiasPagina, limpiarResaltado]);

  useEffect(() => {
    const handleGuideEvent = (event) => {
      const guideId = event.detail?.guideId;
      if (!guideId || !KAFFI_GUIDES[guideId]) return;
      iniciarGuia(guideId);
    };

    const handleMessageEvent = (event) => {
      if (event.detail?.mensaje) {
        setMensajes((prev) => [...prev, { role: 'assistant', content: event.detail.mensaje }]);
      }
      if (event.detail?.guideId && KAFFI_GUIDES[event.detail.guideId]) {
        iniciarGuia(event.detail.guideId);
        return;
      }
      setChatAbierto(true);
    };

    window.addEventListener('kaffi-guide', handleGuideEvent);
    window.addEventListener('kaffi-message', handleMessageEvent);

    return () => {
      window.removeEventListener('kaffi-guide', handleGuideEvent);
      window.removeEventListener('kaffi-message', handleMessageEvent);
    };
  }, [iniciarGuia]);

  const enfocarPaso = (step = paso) => {
    if (!step?.target) return;

    limpiarResaltado();

    const el = document.querySelector(step.target);
    if (!el) return;

    targetRef.current = el;
    el.classList.add(...HIGHLIGHT_CLASS.split(' '));

    if (step.action === 'click' && typeof el.click === 'function') {
      el.click();
      setTimeout(() => enfocarPaso({ ...step, action: null }), 180);
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (typeof el.focus === 'function') {
      el.focus({ preventScroll: true });
    }
  };

  const avanzarGuia = () => {
    limpiarResaltado();
    if (!guiaActiva) return;

    if (esUltimoPaso) {
      setMensajes((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Listo. Ya terminamos la guía "${guiaActiva.title}". Si quiere, ahora me puede preguntar algo más específico.`,
        },
      ]);
      setGuiaActivaId(null);
      setPasoActual(0);
      return;
    }

    setPasoActual((prev) => prev + 1);
  };

  const retrocederGuia = () => {
    limpiarResaltado();
    setPasoActual((prev) => Math.max(0, prev - 1));
  };

  const enviar = async (texto = entrada) => {
    const contenido = texto.trim();
    if (!contenido || cargando) return;

    if (esLenguajeOfensivo(contenido)) {
      setMensajes((prev) => [
        ...prev,
        { role: 'user', content: contenido },
        {
          role: 'assistant',
          content:
            'Puedo ayudarle mejor si hablamos con respeto. Si me dice qué necesita hacer en esta pantalla, le respondo con pasos claros.',
        },
      ]);
      setEntrada('');
      setChatAbierto(true);
      setSugerencias(['Ayúdeme con esta pantalla', 'Explique paso a paso', 'Qué me recomienda hacer']);
      return;
    }

    const nuevosMensajes = [...mensajes, { role: 'user', content: contenido }];
    setMensajes(nuevosMensajes);
    setEntrada('');
    setCargando(true);
    setChatAbierto(true);

    try {
      const { data } = await axios.post(`${API_URL}/api/chatbot`, {
        mensajes: nuevosMensajes.map(({ role, content }) => ({ role, content })),
        contexto: {
          pagina: window.location.pathname,
          ruta: location.pathname,
          timestamp: new Date().toISOString(),
          guiaActiva: guiaActiva?.title || null,
          pasoActual: paso?.text || null,
          ayudaPagina: ayudaPagina?.title || null,
          resumenAyuda: ayudaPagina?.summary || null,
          accionesDisponibles: ayudaPagina?.actions?.map((accion) => accion.label) || [],
          datosPagina: leerDatosPaginaKaffi(),
        },
      });

      setMensajes([...nuevosMensajes, { role: 'assistant', content: data.respuesta }]);

      if (data.sugerencias) {
        setSugerencias(data.sugerencias);
      }
    } catch (error) {
      console.error('Error:', error);
      setMensajes([
        ...nuevosMensajes,
        {
          role: 'assistant',
          content: 'Se me cruzó la señal un momento. Inténtelo otra vez y seguimos.',
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  const ejecutarAccionRapida = (label) => {
    const accion = ayudaPagina?.actions?.find((item) => item.label === label);
    if (accion?.guideId) {
      iniciarGuia(accion.guideId);
      return;
    }
    if (accion?.prompt) {
      enviar(accion.prompt);
      return;
    }

    const guia = guiasPagina.find((item) => item.title.toLowerCase() === label.toLowerCase());
    if (guia) {
      iniciarGuia(guia.id);
      return;
    }

    enviar(label);
  };

  const togglePanelFijado = () => {
    const next = !panelFijado;
    setPanelFijado(next);
    localStorage.setItem(STORAGE_PINNED, String(next));
  };

  const botonPrincipal = () => {
    setChatAbierto((prev) => !prev);
  };

  const mostrarPanel = chatAbierto || panelFijado;
  const floatingPositionClass = usuario
    ? 'bottom-[6.25rem] right-3 sm:bottom-5 sm:right-5'
    : 'bottom-4 right-3 sm:bottom-5 sm:right-5';

  return (
    <div className={`fixed z-40 flex flex-col items-end gap-2 ${floatingPositionClass}`}>
      {mostrarPanel && (
        <div className="flex max-h-[min(68vh,34rem)] w-[min(calc(100vw-1.25rem),22rem)] flex-col overflow-hidden rounded-3xl border border-[#E0D0B0] bg-white shadow-xl sm:max-h-[34rem] sm:w-80">
          <div className="flex items-center gap-2 bg-linear-to-r from-[#3D1F0F] to-[#7A4020] px-3 py-3">
            <img
              src="/kaffi.png"
              alt="Kaffi"
              className="h-8 w-8 rounded-full border-2 border-[#C8A96E] object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white">Kaffi</p>
              <p className="text-[10px] text-[#E6C891]">
                {ayudaPagina?.title || 'Ayuda de la plataforma'}
              </p>
            </div>
            <button
              onClick={togglePanelFijado}
              className={`ml-auto rounded-full px-2 py-1 text-[10px] font-semibold transition ${
                panelFijado ? 'bg-white/15 text-white' : 'text-white/75 hover:text-white'
              }`}
            >
              {panelFijado ? 'Fijado' : 'Fijar'}
            </button>
            <button
              onClick={() => setChatAbierto(false)}
              className="text-base text-white/75 transition hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="border-b border-[#E9DCC8] bg-[#FFF8EC] px-3 py-2">
            <p className="text-[10px] font-semibold text-[#7B5C3E]">
              {ayudaPagina?.summary || 'Pregúnteme lo que necesite y si hace falta le voy guiando paso a paso.'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#FAF7F2] p-3">
            {guiaActiva && (
              <div className="mb-3 rounded-2xl border border-[#E7D9BF] bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A735B]">
                  Guía activa
                </p>
                <h3 className="mt-1 text-sm font-bold text-[#2C1A0E]">{guiaActiva.title}</h3>
                <p className="mt-2 text-[11px] leading-relaxed text-[#3D2A1E]">{paso?.text}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {paso?.target && (
                    <button
                      onClick={() => enfocarPaso()}
                      className="rounded-full bg-[#3D1F0F] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#2C1A0E]"
                    >
                      {paso?.cta || 'Mostrar'}
                    </button>
                  )}
                  <button
                    onClick={avanzarGuia}
                    className="rounded-full border border-[#C8A96E] px-3 py-1.5 text-[11px] font-semibold text-[#3D1F0F] transition hover:bg-[#F5ECD7]"
                  >
                    {esUltimoPaso ? 'Terminar' : 'Siguiente'}
                  </button>
                  {pasoActual > 0 && (
                    <button
                      onClick={retrocederGuia}
                      className="rounded-full border border-[#D7C0A1] px-3 py-1.5 text-[11px] font-semibold text-[#6A543F] transition hover:bg-white"
                    >
                      Atrás
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {mensajes.map((mensaje, index) => (
                <div
                  key={`${mensaje.role}-${index}`}
                  className={`flex gap-2 ${mensaje.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {mensaje.role === 'assistant' && (
                    <img
                      src="/kaffi.png"
                      alt="K"
                      className="mt-1 h-6 w-6 shrink-0 rounded-full border border-[#C8A96E] object-cover"
                    />
                  )}
                  <div
                    className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-2.5 py-2 text-[11px] leading-relaxed ${
                      mensaje.role === 'user'
                        ? 'rounded-br-sm bg-[#3D1F0F] text-white'
                        : 'rounded-bl-sm border border-[#E0D0B0] bg-white text-[#2C1A0E]'
                    }`}
                  >
                    {mensaje.content}
                  </div>
                </div>
              ))}

              {cargando && (
                <div className="flex justify-start gap-2">
                  <img
                    src="/kaffi.png"
                    alt="K"
                    className="h-6 w-6 shrink-0 rounded-full border border-[#C8A96E] object-cover"
                  />
                  <div className="rounded-2xl rounded-bl-sm border border-[#E0D0B0] bg-white px-2.5 py-2">
                    <span className="animate-pulse text-[11px] text-[#C8A96E]">
                      Kaffi está pensando...
                    </span>
                  </div>
                </div>
              )}

              {sugerencias.length > 0 && !cargando && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {sugerencias.map((sug, idx) => (
                    <button
                      key={`${sug}-${idx}`}
                      onClick={() => ejecutarAccionRapida(sug)}
                      className="rounded-full border border-[#C8A96E] bg-[#F5ECD7] px-2.5 py-1 text-[10px] text-[#3D1F0F] transition hover:bg-[#C8A96E] hover:text-white"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              <div ref={finRef} />
            </div>
          </div>

          <div className="border-t border-[#E0D0B0] bg-white p-2.5">
            <div className="flex gap-2">
              <input
                value={entrada}
                onChange={(event) => setEntrada(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && enviar()}
                placeholder="Pregúntele algo a Kaffi..."
                className="flex-1 rounded-xl border border-[#C8A96E]/30 bg-[#F5ECD7] px-3 py-2 text-[11px] text-[#3B1F0A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8A96E]/50"
              />
              <button
                onClick={() => enviar()}
                disabled={cargando || !entrada.trim()}
                className="rounded-xl bg-[#3D1F0F] px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-[#2C1A0E] disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={botonPrincipal}
        className="group relative flex h-13 w-13 items-center justify-center overflow-hidden rounded-full border-4 border-[#C8A96E] shadow-lg transition-all hover:scale-105 sm:h-15 sm:w-15"
      >
        <img
          src="/kaffi.png"
          alt="Kaffi"
          className="h-full w-full object-cover transition group-hover:scale-110"
        />
      </button>
    </div>
  );
}
