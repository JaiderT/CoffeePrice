import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useKaffiContext } from "../hooks/useKaffiContext"; // 👈 NUEVO

export default function Kaffi() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([
    {
      role: "assistant",
      content: "¡Buenas, amigo! Soy Kaffi ☕\nPreguntame lo que quieras sobre el precio del café, los compradores de Pital o cualquier cosa de la plataforma. ¡Aquí estoy, pues!",
    },
  ]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [sugerencias, setSugerencias] = useState([]); // 👈 NUEVO
  const finRef = useRef(null);

  // 👈 NUEVO: Activar contexto proactivo
  useKaffiContext(setMensajes, setAbierto);

  useEffect(() => {
    if (abierto) finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, abierto]);

  // 👈 NUEVO: Escuchar eventos del tour
  useEffect(() => {
    const handleKaffiMessage = (event) => {
      setMensajes(prev => [...prev, { 
        role: "assistant", 
        content: event.detail.mensaje 
      }]);
      setAbierto(true);
    };
    
    window.addEventListener('kaffi-message', handleKaffiMessage);
    return () => window.removeEventListener('kaffi-message', handleKaffiMessage);
  }, []);

  const enviar = async () => {
    if (!entrada.trim() || cargando) return;
    
    const nuevosMensajes = [...mensajes, { role: "user", content: entrada }];
    setMensajes(nuevosMensajes);
    setEntrada("");
    setCargando(true);
    
    try {
      // 👈 MODIFICADO: Enviar también el contexto de la página
      const { data } = await axios.post(`${API_URL}/api/chatbot`, {
        mensajes: nuevosMensajes.map(({ role, content }) => ({ role, content })),
        contexto: { // 👈 NUEVO
          pagina: window.location.pathname,
          timestamp: new Date().toISOString()
        }
      });
      
      setMensajes([
        ...nuevosMensajes,
        { role: "assistant", content: data.respuesta },
      ]);
      
      // 👈 NUEVO: Guardar sugerencias
      if (data.sugerencias) {
        setSugerencias(data.sugerencias);
      }
      
    } catch (error) {
      console.error('Error:', error);
      setMensajes([
        ...nuevosMensajes,
        {
          role: "assistant",
          content: "Ay, hermano, se me fue la señal. Intentá de nuevo en un ratico.",
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  // 👈 NUEVO: Función para enviar sugerencias rápidas
  const enviarSugerencia = (sugerencia) => {
    setEntrada(sugerencia);
    setTimeout(() => enviar(), 100);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Ventana del chat */}
      {abierto && (
        <div
          className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E0D0B0] overflow-hidden flex flex-col"
          style={{ height: "480px" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#3D1F0F] to-[#7A4020] px-4 py-3 flex items-center gap-3">
            <img
              src="/kaffi.png"
              alt="Kaffi"
              className="w-10 h-10 rounded-full border-2 border-[#C8A96E] object-cover"
            />
            <div>
              <p className="text-white font-bold text-sm">Kaffi ☕</p>
              <p className="text-[#C8A96E] text-xs">
                Tu amigo cafetero del Huila
              </p>
            </div>
            <button
              onClick={() => setAbierto(false)}
              className="ml-auto text-white/70 hover:text-white text-lg transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF7F2]">
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}
              >
                {m.role === "assistant" && (
                  <img
                    src="/kaffi.png"
                    alt="K"
                    className="w-7 h-7 rounded-full border border-[#C8A96E] object-cover shrink-0 mt-1"
                  />
                )}
                <div
                  className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-[#3D1F0F] text-white rounded-br-sm"
                      : "bg-white border border-[#E0D0B0] text-[#2C1A0E] rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            
            {cargando && (
              <div className="flex justify-start gap-2">
                <img
                  src="/kaffi.png"
                  alt="K"
                  className="w-7 h-7 rounded-full border border-[#C8A96E] object-cover shrink-0"
                />
                <div className="bg-white border border-[#E0D0B0] px-3 py-2 rounded-2xl rounded-bl-sm">
                  <span className="text-[#C8A96E] text-sm animate-pulse">
                    Kaffi está pensando...
                  </span>
                </div>
              </div>
            )}
            
            {/* 👈 NUEVO: Botones de sugerencias */}
            {sugerencias.length > 0 && !cargando && mensajes[mensajes.length - 1]?.role === "assistant" && (
              <div className="flex flex-wrap gap-2 mt-2 justify-start">
                {sugerencias.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => enviarSugerencia(sug)}
                    className="text-xs bg-[#F5ECD7] text-[#3D1F0F] px-3 py-1.5 rounded-full border border-[#C8A96E] hover:bg-[#C8A96E] hover:text-white transition-all duration-200 hover:scale-105"
                  >
                    💡 {sug}
                  </button>
                ))}
              </div>
            )}
            
            <div ref={finRef} />
          </div>
          
          {/* Input */}
          <div className="p-3 border-t border-[#E0D0B0] flex gap-2 bg-white">
            <input
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && enviar()}
              placeholder="Preguntale algo a Kaffi..."
              className="flex-1 px-3 py-2 rounded-xl border border-[#C8A96E]/30 bg-[#F5ECD7] text-sm text-[#3B1F0A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8A96E]/50"
            />
            <button
              onClick={enviar}
              disabled={cargando || !entrada.trim()}
              className="bg-[#3D1F0F] text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-[#2C1A0E] disabled:opacity-50 transition-colors"
            >
              ➤
            </button>
          </div>
        </div>
      )}
      
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="relative w-16 h-16 rounded-full shadow-2xl border-2 border-[#C8A96E] overflow-hidden hover:scale-105 transition-all animate-pulse"
      >
        <img
          src="/kaffi.png"
          alt="Kaffi"
          className="w-full h-full object-cover"
        />
        {!abierto && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#C8A96E] rounded-full flex items-center justify-center animate-bounce">
            <span className="text-[8px] text-white font-bold">☕</span>
          </div>
        )}
      </button>
    </div>
  );
}