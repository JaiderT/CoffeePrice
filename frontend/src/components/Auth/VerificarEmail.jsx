// pages/VerificarEmail.jsx
// Agregar en tu router: <Route path="/verificar-email" element={<VerificarEmail />} />

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function VerificarEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get("status");

  // "cargando" mientras el backend procesa, luego "ok" | "invalido" | "error" | "pendiente"
  const [estado, setEstado] = useState("cargando");

  useEffect(() => {
    if (status === "ok") setEstado("ok");
    else if (status === "invalido") setEstado("invalido");
    else if (status === "error") setEstado("error");
    else if (!status) setEstado("pendiente");
  }, [status]);

  const contenido = {
    cargando: {
      emoji: "⏳",
      titulo: "Activando tu cuenta...",
      descripcion: "Un momento por favor.",
      boton: null,
    },
    pendiente: {
      emoji: "📬",
      titulo: "Revisa tu correo",
      descripcion: "Te enviamos un link de activación. Haz clic en el botón del correo para activar tu cuenta. El link expira en 24 horas.",
      boton: null,
    },
    ok: {
      emoji: "✅",
      titulo: "¡Cuenta activada!",
      descripcion: "Tu cuenta está lista. También te enviamos un correo de confirmación. Ya puedes iniciar sesión.",
      boton: { label: "Iniciar sesión", ruta: "/login" },
    },
    invalido: {
      emoji: "⚠️",
      titulo: "Link inválido o expirado",
      descripcion: "Este link ya fue usado o expiró. Regístrate de nuevo para recibir un link fresco.",
      boton: { label: "Volver al registro", ruta: "/register" },
    },
    error: {
      emoji: "❌",
      titulo: "Algo salió mal",
      descripcion: "Hubo un error activando tu cuenta. Intenta de nuevo más tarde.",
      boton: { label: "Volver al inicio", ruta: "/" },
    },
  };

  const actual = contenido[estado];

  return (
    <div className="min-h-screen bg-[#F0E8D5] flex items-center justify-center px-4">
      <div className="bg-[#fffdf8] border border-[#d4b896] rounded-2xl p-10 max-w-md w-full text-center">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-[#3d1f0d] rounded-xl flex items-center justify-center text-lg">☕</div>
          <span className="text-xl font-black text-[#2C1A0E]" style={{ fontFamily: "Georgia, serif" }}>
            CoffePrice
          </span>
        </div>

        {/* Spinner solo en estado cargando */}
        {estado === "cargando" ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-10 h-10 border-4 border-[#d4b896] border-t-[#3d1f0d] rounded-full animate-spin" />
            <p className="text-sm text-[#7a5c3e]">Activando tu cuenta...</p>
          </div>
        ) : (
          <>
            <div className="text-5xl mb-5">{actual.emoji}</div>
            <h2 className="text-xl font-bold text-[#2C1A0E] mb-3">{actual.titulo}</h2>
            <p className="text-sm text-[#7a5c3e] leading-relaxed mb-8">{actual.descripcion}</p>

            {actual.boton && (
              <button
                onClick={() => navigate(actual.boton.ruta)}
                className="w-full bg-[#3d1f0d] text-[#f5dfc0] font-semibold py-3 rounded-xl hover:bg-[#5a2e12] transition text-sm"
              >
                {actual.boton.label}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}