import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import axios from "axios";

// ─── Colores principales del proyecto ───────────────────────────────────────
// Fondo página    : #F0E8D5
// Marrón oscuro   : #3D1F0F  /  #2C1A0E
// Marrón medio    : #7A4020  /  #5D2E0C
// Naranja/dorado  : #C8814A  /  #E8A870
// Crema texto     : #F5ECD7
// Texto oscuro    : #3B1F0A
// Borde suave     : #E7D9BF  /  #E0D8CE
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = ["Correo", "Código", "Nueva clave"];

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const API_URL  = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await axios.post(
        `${API_URL}/api/recuperar/solicitar-codigo`,
        { email }
      );
      setMessage({
        type: "success",
        text: response.data.message || "¡Código enviado! Revisa tu correo.",
      });
      setTimeout(() => navigate("/verify-code", { state: { email } }), 2000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error al enviar el código",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "#F0E8D5" }}>

      {/* ── Tarjeta ── */}
      <div className="relative w-full max-w-md z-10">

        {/* Barra superior de marca */}
        <div className="h-10 w-full rounded-t-2xl" style={{ background: "linear-gradient(90deg,#3D1F0F,#C8814A,#E8A870)" }} />

        <div className="bg-white rounded-b-2xl shadow-2xl overflow-hidden" style={{ border: "1px solid #E7D9BF", borderTop: "none" }}>

          {/* ── Divider ── */}
          <div style={{ height: "1px", background: "#F5ECD7", margin: "0 2rem" }} />

          {/* ── Cuerpo ── */}
          <div className="px-8 pt-6 pb-8">

            {/* Icono + título */}
            <div className="flex items-start gap-4 mb-6">
              <div
                className="shrink-0 flex items-center justify-center rounded-2xl"
                style={{ width: 52, height: 52, background: "#FFF8EC", border: "1.5px solid #E7D9BF" }}
              >
                <svg viewBox="0 0 640 640" fill="#C8814A" width="26" height="26">
                  <path d="M184 48C170.7 48 160 58.7 160 72C160 110.9 183.4 131.4 199.1 145.1L200.2 146.1C216.5 160.4 224 167.9 224 184C224 197.3 234.7 208 248 208C261.3 208 272 197.3 272 184C272 145.1 248.6 124.6 232.9 110.9L231.8 109.9C215.5 95.7 208 88.1 208 72C208 58.7 197.3 48 184 48zM128 256C110.3 256 96 270.3 96 288L96 480C96 533 139 576 192 576L384 576C425.8 576 461.4 549.3 474.5 512L480 512C550.7 512 608 454.7 608 384C608 313.3 550.7 256 480 256L128 256zM480 448L480 320C515.3 320 544 348.7 544 384C544 419.3 515.3 448 480 448zM320 72C320 58.7 309.3 48 296 48C282.7 48 272 58.7 272 72C272 110.9 295.4 131.4 311.1 145.1L312.2 146.1C328.5 160.4 336 167.9 336 184C336 197.3 346.7 208 360 208C373.3 208 384 197.3 384 184C384 145.1 360.6 124.6 344.9 110.9L343.8 109.9C327.5 95.7 320 88.1 320 72z"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#C8814A" }}>
                  CoffePrice
                </p>
                <h2 className="font-black text-2xl leading-tight font-serif" style={{ color: "#3B1F0A" }}>
                  Recupera tu acceso
                </h2>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: "#8B6A4A" }}>
                  Te enviamos un código al correo registrado.
                </p>
              </div>
            </div>

            {/* Tip con acento lateral */}
            <div
              className="rounded-xl px-4 py-3 mb-5 text-xs leading-relaxed"
              style={{
                background: "#FFF8EC",
                borderLeft: "3px solid #C8814A",
                color: "#7B5C3E",
              }}
            >
              El código llega en menos de 2 minutos. Si no aparece, revisa la carpeta de spam.
            </div>

            {/* Campo email */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#3B1F0A" }}>
                Correo electrónico
              </label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#C8A96E" }}>
                  📧
                </span>
                <input
                  type="email"
                  placeholder="tucorreo@gmail.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 text-sm rounded-xl transition-all outline-none"
                  style={{
                    border: "1.5px solid #E7D9BF",
                    background: "#FDFAF5",
                    color: "#3B1F0A",
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = "#C8814A";
                    e.target.style.boxShadow   = "0 0 0 3px rgba(200,129,74,0.12)";
                    e.target.style.background  = "#fff";
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = "#E7D9BF";
                    e.target.style.boxShadow   = "none";
                    e.target.style.background  = "#FDFAF5";
                  }}
                />
              </div>
            </div>

            {/* Mensaje éxito / error */}
            {message.text && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold mb-4"
                style={
                  message.type === "success"
                    ? { background: "#F0FDF4", border: "1px solid #86EFAC", color: "#166534" }
                    : { background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }
                }
              >
                <span>{message.type === "success" ? "✅" : "❌"}</span>
                {message.text}
              </div>
            )}

            {/* Botón enviar */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold relative overflow-hidden group transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed mb-3"
              style={{ background: "linear-gradient(135deg,#3D1F0F,#7A4020)", color: "#F5ECD7" }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background = "linear-gradient(135deg,#4a2815,#8a4a28)")}
              onMouseLeave={e => !loading && (e.currentTarget.style.background = "linear-gradient(135deg,#3D1F0F,#7A4020)")}
            >
              {/* shimmer */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)" }} />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Enviando código...
                  </>
                ) : (
                  <>☕ Enviar código</>
                )}
              </span>
            </button>

            {/* Volver */}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ border: "1.5px solid #E7D9BF", color: "#7A4020", background: "transparent" }}
              onMouseEnter={e => {
                e.currentTarget.style.background    = "rgba(200,129,74,0.06)";
                e.currentTarget.style.borderColor   = "#C8814A";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background    = "transparent";
                e.currentTarget.style.borderColor   = "#E7D9BF";
              }}
            >
              Volver al inicio de sesión
            </button>

          </div>

          {/* ── Footer ── */}
          <div className="px-8 py-3 text-center text-xs border-t" style={{ borderColor: "#F5ECD7", color: "#C8A96E", background: "#FDFAF5" }}>
            © 2024 CoffePrice · El Pital, Huila
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%,60%{transform:translateX(-3px)}
          40%,80%{transform:translateX(3px)}
        }
        .animate-shake { animation: shake 0.4s ease; }
      `}</style>
    </div>
  );
}