import { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function Kaffi() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([
    {
      role: "assistant",
      content:
        "¡Buenas, hermano! Soy Kaffi ☕\nPreguntame lo que quieras sobre el precio del café, los compradores de Pital o cualquier cosita de la plataforma. ¡Aquí estoy, pues!",
    },
  ]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const finRef = useRef(null);

  useEffect(() => {
    if (abierto) finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, abierto]);

  const enviar = async () => {
    if (!entrada.trim() || cargando) return;
    const nuevosMensajes = [...mensajes, { role: "user", content: entrada }];
    setMensajes(nuevosMensajes);
    setEntrada("");
    setCargando(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/chatbot`, {
        mensajes: nuevosMensajes.filter(
          (m) => m.role !== "assistant" || nuevosMensajes.indexOf(m) > 0,
        ),
      });
      setMensajes([
        ...nuevosMensajes,
        { role: "assistant", content: data.respuesta },
      ]);
    } catch {
      setMensajes([
        ...nuevosMensajes,
        {
          role: "assistant",
          content:
            "Ay, hermano, se me fue la señal. Intentá de nuevo en un ratico.",
        },
      ]);
    } finally {
      setCargando(false);
    }
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
          <div className="bg-linear-to-r from-[#3D1F0F] to-[#7A4020] px-4 py-3 flex items-center gap-3">
            <img
              src="/frontend/public/kaffi.png"
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
              className="ml-auto text-white/70 hover:text-white text-lg"
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
                  src="/frontend/public/kaffi.png"
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
        className="relative w-16 h-16 rounded-full shadow-2xl border-2 border-[#C8A96E] overflow-hidden hover:scale-105 transition-transform"
      >
        <img
          src="/kaffi.png"
          alt="Kaffi"
          className="w-full h-full object-cover"
        />
        {!abierto && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#C8A96E] rounded-full flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">☕</span>
          </div>
        )}
      </button>
    </div>
  );
}
