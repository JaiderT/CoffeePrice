import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import {
  KAFFI_GUIDES,
  ONBOARDING_GUIDE_IDS,
  PAGE_DEFAULT_GUIDE,
  getGuidesForPath,
} from "../data/kaffiGuides";

const MENSAJE_INICIAL =
  "Buenas. Soy Kaffi y estoy para ayudarle con la plataforma sin enredos.";

const STORAGE_DONE = "kaffi_onboarding_done";
const STORAGE_SEEN = "kaffi_guides_seen";
const HIGHLIGHT_CLASS =
  "ring-4 ring-[#C8A96E] ring-offset-4 ring-offset-[#FFF8EC] shadow-[0_0_0_6px_rgba(200,169,110,0.20)]";

function leerLista(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export default function Kaffi() {
  const API_URL = import.meta.env.VITE_API_URL;
  const location = useLocation();
  const finRef = useRef(null);
  const targetRef = useRef(null);

  const [chatAbierto, setChatAbierto] = useState(false);
  const [coachVisible, setCoachVisible] = useState(false);
  const [mensajes, setMensajes] = useState([
    { role: "assistant", content: MENSAJE_INICIAL },
  ]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [sugerencias, setSugerencias] = useState([]);
  const [guiaActivaId, setGuiaActivaId] = useState(null);
  const [pasoActual, setPasoActual] = useState(0);
  const [esMovil, setEsMovil] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  const [onboardingDone, setOnboardingDone] = useState(
    localStorage.getItem(STORAGE_DONE) === "true"
  );
  const [guidesSeen, setGuidesSeen] = useState(() => leerLista(STORAGE_SEEN));

  const guiasPagina = useMemo(
    () => getGuidesForPath(location.pathname),
    [location.pathname]
  );

  const guiaActiva = guiaActivaId ? KAFFI_GUIDES[guiaActivaId] : null;
  const paso = guiaActiva?.steps?.[pasoActual] || null;
  const esUltimoPaso =
    guiaActiva && pasoActual === guiaActiva.steps.length - 1;

  useEffect(() => {
    if (chatAbierto) {
      finRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatAbierto, mensajes]);

  useEffect(() => {
    const handleResize = () => setEsMovil(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    return () => limpiarResaltado();
  }, []);

  useEffect(() => {
    const currentGuideId = PAGE_DEFAULT_GUIDE[location.pathname] || null;
    setSugerencias(guiasPagina.map((guia) => guia.title));

    if (!currentGuideId) {
      setCoachVisible(false);
      setGuiaActivaId(null);
      setPasoActual(0);
      return;
    }

    const currentGuide = KAFFI_GUIDES[currentGuideId];
    const yaVista = guidesSeen.includes(currentGuideId);

    setGuiaActivaId(currentGuideId);
    setPasoActual(0);

    if (!onboardingDone && currentGuide?.onboarding && !yaVista) {
      setCoachVisible(true);
    } else {
      setCoachVisible(false);
    }
  }, [location.pathname, guiasPagina, guidesSeen, onboardingDone]);

  useEffect(() => {
    const handleGuideEvent = (event) => {
      const guideId = event.detail?.guideId;
      if (!guideId || !KAFFI_GUIDES[guideId]) return;
      setGuiaActivaId(guideId);
      setPasoActual(0);
      setCoachVisible(true);
      if (event.detail?.openChat) {
        setChatAbierto(true);
      }
    };

    const handleMessageEvent = (event) => {
      if (event.detail?.mensaje) {
        setMensajes((prev) => [
          ...prev,
          { role: "assistant", content: event.detail.mensaje },
        ]);
      }
      if (event.detail?.guideId && KAFFI_GUIDES[event.detail.guideId]) {
        setGuiaActivaId(event.detail.guideId);
        setPasoActual(0);
        setCoachVisible(true);
      }
      setChatAbierto(true);
    };

    window.addEventListener("kaffi-guide", handleGuideEvent);
    window.addEventListener("kaffi-message", handleMessageEvent);

    return () => {
      window.removeEventListener("kaffi-guide", handleGuideEvent);
      window.removeEventListener("kaffi-message", handleMessageEvent);
    };
  }, []);

  const guardarGuideVista = (guideId) => {
    if (!guideId) return;
    const nextSeen = Array.from(new Set([...guidesSeen, guideId]));
    setGuidesSeen(nextSeen);
    localStorage.setItem(STORAGE_SEEN, JSON.stringify(nextSeen));

    const done = ONBOARDING_GUIDE_IDS.every((id) => nextSeen.includes(id));
    if (done) {
      setOnboardingDone(true);
      localStorage.setItem(STORAGE_DONE, "true");
    }
  };

  const limpiarResaltado = () => {
    if (targetRef.current) {
      targetRef.current.classList.remove(...HIGHLIGHT_CLASS.split(" "));
      targetRef.current = null;
    }
  };

  const enfocarPaso = (step = paso) => {
    if (!step?.target) return;

    limpiarResaltado();

    const el = document.querySelector(step.target);
    if (!el) return;

    targetRef.current = el;
    el.classList.add(...HIGHLIGHT_CLASS.split(" "));

    if (step.action === "click" && typeof el.click === "function") {
      el.click();
      setTimeout(() => enfocarPaso({ ...step, action: null }), 180);
      return;
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    if (typeof el.focus === "function") {
      el.focus({ preventScroll: true });
    }
  };

  const completarGuia = () => {
    limpiarResaltado();
    if (guiaActiva?.onboarding) {
      guardarGuideVista(guiaActiva.id);
    }
    setCoachVisible(false);
    setChatAbierto(true);
  };

  const cambiarPaso = (direction) => {
    limpiarResaltado();
    if (!guiaActiva) return;

    if (direction > 0 && esUltimoPaso) {
      completarGuia();
      return;
    }

    setPasoActual((prev) => {
      const next = prev + direction;
      return Math.max(0, Math.min(next, guiaActiva.steps.length - 1));
    });
  };

  const cerrarCoach = () => {
    limpiarResaltado();
    setCoachVisible(false);
  };

  const seleccionarGuia = (guideId) => {
    limpiarResaltado();
    setGuiaActivaId(guideId);
    setPasoActual(0);
    setCoachVisible(true);
  };

  const abrirChatConGuia = () => {
    if (guiaActiva) {
      const aviso = `Le acompano con "${guiaActiva.title}". ${guiaActiva.intro}`;
      setMensajes((prev) =>
        prev[prev.length - 1]?.content === aviso
          ? prev
          : [...prev, { role: "assistant", content: aviso }]
      );
    }
    if (esMovil) {
      setCoachVisible(false);
    }
    setChatAbierto(true);
  };

  const enviar = async (texto = entrada) => {
    const contenido = texto.trim();
    if (!contenido || cargando) return;

    const nuevosMensajes = [...mensajes, { role: "user", content: contenido }];
    setMensajes(nuevosMensajes);
    setEntrada("");
    setCargando(true);

    try {
      const { data } = await axios.post(`${API_URL}/api/chatbot`, {
        mensajes: nuevosMensajes.map(({ role, content }) => ({ role, content })),
        contexto: {
          pagina: window.location.pathname,
          timestamp: new Date().toISOString(),
          guiaActiva: guiaActiva?.title || null,
          pasoActual: paso?.text || null,
        },
      });

      setMensajes([
        ...nuevosMensajes,
        { role: "assistant", content: data.respuesta },
      ]);

      if (data.sugerencias) {
        setSugerencias(data.sugerencias);
      }
    } catch (error) {
      console.error("Error:", error);
      setMensajes([
        ...nuevosMensajes,
        {
          role: "assistant",
          content:
            "Se me cruzo la senal un momento. Intentelo otra vez y seguimos.",
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  const enviarSugerencia = (sugerencia) => {
    const guia = guiasPagina.find(
      (item) => item.title.toLowerCase() === sugerencia.toLowerCase()
    );

    if (guia) {
      seleccionarGuia(guia.id);
      return;
    }

    enviar(sugerencia);
  };

  const botonPrincipal = () => {
    setChatAbierto((prev) => !prev);
  };

  return (
    <div className="fixed bottom-4 right-3 z-50 flex flex-col items-end gap-1.5 sm:bottom-5 sm:right-5 sm:gap-2">
      {coachVisible && guiaActiva && (
        <div className="relative w-[11.5rem] max-w-[calc(100vw-4.75rem)] rounded-[18px] border border-[#E0D0B0] bg-[#FFF8EC]/96 p-2 shadow-lg backdrop-blur sm:w-[15rem] sm:max-w-[calc(100vw-5.5rem)] sm:rounded-[20px] sm:p-2.5">
          <div className="absolute -bottom-1 right-5 h-3 w-3 rotate-45 border-b border-r border-[#E0D0B0] bg-[#FFF8EC]/96 sm:right-6" />
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8A735B] sm:text-[10px]">
                  Kaffi
                </p>
                <h3 className="mt-0.5 line-clamp-1 text-[11px] font-bold text-[#2C1A0E] sm:text-xs">
                  {guiaActiva.title}
                </h3>
              </div>
              <button
                onClick={cerrarCoach}
                className="shrink-0 text-[9px] font-semibold text-[#8A735B] transition hover:text-[#3D1F0F] sm:text-[10px]"
              >
                ×
              </button>
            </div>

            <div className="mt-1.5 rounded-2xl bg-white px-2 py-1.5 ring-1 ring-[#E7D9BF] sm:mt-2 sm:px-2.5 sm:py-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8A735B] sm:text-[10px]">
                Paso {pasoActual + 1}/{guiaActiva.steps.length}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-[#3D2A1E] line-clamp-3 sm:text-[11px] sm:line-clamp-4">
                {paso?.text}
              </p>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1 sm:mt-2 sm:gap-1.5">
              {paso?.target && (
                <button
                  onClick={() => enfocarPaso()}
                  className="rounded-full bg-[#3D1F0F] px-2 py-1 text-[9px] font-semibold text-white transition hover:bg-[#2C1A0E] sm:px-2.5 sm:text-[10px]"
                >
                  {esMovil ? "Ver" : paso?.cta || "Mostrar"}
                </button>
              )}
              <button
                onClick={() => cambiarPaso(1)}
                className="rounded-full border border-[#C8A96E] px-2 py-1 text-[9px] font-semibold text-[#3D1F0F] transition hover:bg-[#F5ECD7] sm:px-2.5 sm:text-[10px]"
              >
                {esUltimoPaso ? "Listo" : "Sigue"}
              </button>
              <button
                onClick={abrirChatConGuia}
                className="rounded-full border border-[#D7C0A1] px-2 py-1 text-[9px] font-semibold text-[#6A543F] transition hover:bg-white sm:px-2.5 sm:text-[10px]"
              >
                Chat
              </button>
            </div>

            {guiaActiva.steps.length > 1 && (
              <div className="mt-1.5 flex items-center justify-between gap-1 sm:mt-2 sm:gap-1.5">
                <button
                  onClick={() => cambiarPaso(-1)}
                  disabled={pasoActual === 0}
                  className="rounded-full border border-[#D7C0A1] px-2 py-1 text-[9px] font-semibold text-[#6A543F] transition hover:bg-white disabled:opacity-40 sm:text-[10px]"
                >
                  Atras
                </button>
                <div className="flex gap-1">
                  {guiaActiva.steps.map((_, index) => (
                    <span
                      key={index}
                      className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${
                        index === pasoActual ? "bg-[#C8A96E]" : "bg-[#E8D8BF]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {chatAbierto && (
        <div className="flex h-[280px] w-[calc(100vw-1rem)] max-w-[15.5rem] flex-col overflow-hidden rounded-2xl border border-[#E0D0B0] bg-white shadow-xl sm:h-[340px] sm:w-[17rem] sm:max-w-[17rem]">
          <div className="flex items-center gap-2 bg-linear-to-r from-[#3D1F0F] to-[#7A4020] px-2.5 py-2 sm:px-3 sm:py-2.5">
            <img
              src="/kaffi.png"
              alt="Kaffi"
              className="h-7 w-7 rounded-full border-2 border-[#C8A96E] object-cover sm:h-8 sm:w-8"
            />
            <div>
              <p className="text-[11px] font-bold text-white sm:text-xs">Kaffi</p>
              <p className="text-[9px] text-[#E6C891] sm:text-[10px]">Chat opcional</p>
            </div>
            <button
              onClick={() => setChatAbierto(false)}
              className="ml-auto text-sm text-white/70 transition-colors hover:text-white sm:text-base"
            >
              ×
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto bg-[#FAF7F2] p-2.5 sm:space-y-2.5 sm:p-3">
            {guiasPagina.length > 0 && (
              <div className="rounded-2xl border border-[#E7D9BF] bg-[#FFF9F2] p-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8A735B] sm:text-[10px]">
                  Guias
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1 sm:mt-2 sm:gap-1.5">
                  {guiasPagina.map((guia) => (
                    <button
                      key={guia.id}
                      onClick={() => seleccionarGuia(guia.id)}
                      className="rounded-full border border-[#C8A96E] bg-white px-2 py-1 text-[9px] font-semibold text-[#3D1F0F] transition hover:bg-[#F5ECD7] sm:px-2.5 sm:text-[10px]"
                    >
                      {guia.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensajes.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`flex gap-1.5 sm:gap-2 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <img
                    src="/kaffi.png"
                    alt="K"
                    className="mt-1 h-5 w-5 shrink-0 rounded-full border border-[#C8A96E] object-cover sm:h-6 sm:w-6"
                  />
                )}
                <div
                  className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-2 py-1.5 text-[10px] leading-relaxed sm:max-w-[80%] sm:px-2.5 sm:py-2 sm:text-[11px] ${
                    m.role === "user"
                      ? "rounded-br-sm bg-[#3D1F0F] text-white"
                      : "rounded-bl-sm border border-[#E0D0B0] bg-white text-[#2C1A0E]"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {cargando && (
              <div className="flex justify-start gap-1.5 sm:gap-2">
                <img
                  src="/kaffi.png"
                  alt="K"
                  className="h-5 w-5 shrink-0 rounded-full border border-[#C8A96E] object-cover sm:h-6 sm:w-6"
                />
                <div className="rounded-2xl rounded-bl-sm border border-[#E0D0B0] bg-white px-2 py-1.5 sm:px-2.5 sm:py-2">
                  <span className="text-[10px] text-[#C8A96E] animate-pulse sm:text-[11px]">
                    Kaffi esta pensando...
                  </span>
                </div>
              </div>
            )}

            {sugerencias.length > 0 && !cargando && (
              <div className="mt-1 flex flex-wrap gap-1 justify-start sm:gap-1.5">
                {sugerencias.map((sug, idx) => (
                  <button
                    key={`${sug}-${idx}`}
                    onClick={() => enviarSugerencia(sug)}
                    className="rounded-full border border-[#C8A96E] bg-[#F5ECD7] px-2 py-1 text-[9px] text-[#3D1F0F] transition-all duration-200 hover:bg-[#C8A96E] hover:text-white sm:px-2.5 sm:text-[10px]"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            <div ref={finRef} />
          </div>

          <div className="border-t border-[#E0D0B0] bg-white p-2">
            <div className="flex gap-2">
              <input
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && enviar()}
                placeholder="Preguntele algo..."
                className="flex-1 rounded-xl border border-[#C8A96E]/30 bg-[#F5ECD7] px-2.5 py-2 text-[10px] text-[#3B1F0A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8A96E]/50 sm:px-3 sm:text-[11px]"
              />
              <button
                onClick={() => enviar()}
                disabled={cargando || !entrada.trim()}
                className="rounded-xl bg-[#3D1F0F] px-2.5 py-2 text-[10px] font-bold text-white transition-colors hover:bg-[#2C1A0E] disabled:opacity-50 sm:px-3 sm:text-[11px]"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={botonPrincipal}
        className="group relative h-12 w-12 overflow-hidden rounded-full border-4 border-[#C8A96E] shadow-lg transition-all hover:scale-105 sm:h-14 sm:w-14"
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
