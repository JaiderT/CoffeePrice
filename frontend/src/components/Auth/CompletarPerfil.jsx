import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

export default function CompletarPerfil() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const [nombreempresa, setNombreempresa] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [horario, setHorario] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Si no hay token redirigir al login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Decodificar el token para obtener el id del usuario
  const payload = JSON.parse(atob(token.split(".")[1]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/comprador`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          usuario: payload.id,
          nombreempresa,
          direccion,
          telefono,
          horario,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

      // Guardar token y redirigir
      localStorage.setItem("token", token);
      localStorage.setItem("role", payload.role);
      setSuccess(true);

    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#3D1F0F]">

      {/* PANEL IZQUIERDO - solo desktop */}
      <div className="flex-1 hidden lg:flex flex-col justify-center pl-20 px-16 py-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(200,129,74,0.15) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-20 left-10 w-72 h-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(200,129,74,0.08) 0%, transparent 70%)" }} />

        <div className="flex items-center gap-3 mb-16 relative z-10">
          <div className="w-12 h-12 bg-[#C8814A] rounded-xl flex items-center justify-center text-2xl shadow-lg">☕</div>
          <span className="text-5xl font-black text-white" style={{ fontFamily: "Georgia, serif" }}>CoffePrice</span>
        </div>

        <h1 className="text-6xl font-black text-white leading-tight mb-5 relative z-10" style={{ fontFamily: "Georgia, serif" }}>
          Casi listo <br />
          <span className="text-[#E8A870] italic text-6xl">para comprar café</span>
        </h1>

        <p className="text-white/65 text-2xl leading-relaxed max-w-sm mb-14 relative z-10">
          Completa los datos de tu empresa para que los productores puedan encontrarte y negociar contigo.
        </p>

        <div className="flex gap-3 relative z-10">
          <div className="bg-[#C8814A]/20 rounded-2xl px-5 py-4 border border-[#C8814A]/30">
            <p className="text-white/60 text-xs mb-1">Estado de tu cuenta</p>
            <p className="text-[#E8A870] font-bold text-sm">⏳ Pendiente de aprobación</p>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="w-full lg:w-[680px] bg-[#FAF7F2] flex flex-col justify-center px-6 py-12 sm:px-10 shrink-0 overflow-y-auto">

        {!success ? (
          <>
            {/* Logo móvil */}
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div className="w-10 h-10 bg-[#C8814A] rounded-xl flex items-center justify-center text-xl shadow-lg">☕</div>
              <span className="text-3xl font-black text-[#3B1F0A]" style={{ fontFamily: "Georgia, serif" }}>CoffePrice</span>
            </div>

            <div className="mb-8">
              <span className="text-xs font-bold text-[#C8814A] bg-[#C8814A]/10 px-3 py-1 rounded-full">🏪 Perfil de comprador</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#3B1F0A] mb-1.5" style={{ fontFamily: "Georgia, serif" }}>
              Datos de tu empresa
            </h2>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              Esta información es visible para los productores. Un administrador revisará tu perfil antes de activar tu cuenta.
            </p>

            <form onSubmit={handleSubmit}>

              {/* Nombre empresa */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
                  Nombre de la empresa *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Café El Pital S.A.S"
                  required
                  value={nombreempresa}
                  onChange={(e) => setNombreempresa(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 transition-all"
                />
              </div>

              {/* Dirección */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
                  Dirección del punto físico *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Calle 5 #10-20, El Pital, Huila"
                  required
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 transition-all"
                />
              </div>

              {/* Teléfono */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
                  Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="+57 300 000 0000"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 transition-all"
                />
              </div>

              {/* Horario */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
                  Horario de atención <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Lunes a viernes 7am - 5pm"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 transition-all"
                />
              </div>

              {error && <p className="text-red-500 text-xs mb-3">❌ {error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white text-sm font-bold shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #3D1F0F, #7A4020)" }}
              >
                {loading ? "Enviando..." : "Enviar para aprobación"}
              </button>

            </form>
          </>
        ) : (
          <div className="text-center py-8 px-4">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#3B1F0A] mb-3" style={{ fontFamily: "Georgia, serif" }}>
              ¡Perfil enviado!
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-3">
              Un administrador revisará tu empresa y activará tu cuenta pronto.
            </p>
            <p className="text-xs text-gray-400 mb-8">
              Te notificaremos cuando tu cuenta esté activa.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3.5 rounded-xl text-white text-sm font-bold shadow-lg hover:scale-[1.02] transition-transform"
              style={{ background: "linear-gradient(135deg, #C8814A, #7A4020)" }}
            >
              ☕ Volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}