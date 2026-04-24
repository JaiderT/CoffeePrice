import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { abrirGuiaKaffi } from "../../utils/kaffiEvents";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = import.meta.env.VITE_API_URL;
  const { login } = useAuth();

  const email = location.state?.email || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [pendiente, setPendiente] = useState(false);

  const inputsRef = useRef([]);

  useEffect(() => {
    if (!email) navigate("/register");
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(v => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  function handleChange(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError(null);
    if (digit && index < 5) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !code[index] && index > 0)
      inputsRef.current[index - 1]?.focus();
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newCode = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) newCode[i] = pasted[i];
    setCode(newCode);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleVerify(e) {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setError("Ingresa el código completo de 6 dígitos.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Código incorrecto. Intenta de nuevo.");
        setCode(["", "", "", "", "", ""]);
        inputsRef.current[0]?.focus();
        return;
      }
      if (data.pendiente) { setPendiente(true); return; }
      login(data.token, data.role, data.name, data.apellido, data.id, data.celular, data.email);
      if (data.role === "comprador") {
        navigate("/completar-perfil", { replace: true });
      } else {
        navigate("/precios", { replace: true });
      }
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResendLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || "No se pudo reenviar."); return; }
      setResendCooldown(60);
      setCode(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setResendLoading(false);
    }
  }

  function maskEmail(em) {
    if (!em) return "";
    const [user, domain] = em.split("@");
    if (!domain) return em;
    return `${user.slice(0, 2)}***@${domain}`;
  }

  const isCodeComplete = code.every(d => d !== "");

  return (
    <div className="min-h-screen w-full bg-[#F0E8D5] flex items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">

      {/* Granos de café decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-5 left-5 text-4xl sm:text-6xl md:text-7xl lg:text-8xl opacity-7 animate-bounce">🫘</div>
        <div className="absolute bottom-5 right-5 text-5xl sm:text-7xl md:text-8xl lg:text-9xl opacity-5 animate-bounce animation-delay-1000">🫘</div>
        <div className="absolute top-1/4 left-1/4 text-3xl sm:text-5xl md:text-6xl lg:text-7xl opacity-10 animate-pulse">☕</div>
        <div className="absolute bottom-1/4 right-1/4 text-3xl sm:text-5xl md:text-6xl lg:text-7xl opacity-5 animate-pulse animation-delay-500">🌿</div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-200 h-full max-h-200 rounded-full bg-[#C8814A]/5 blur-3xl" />
      </div>

      {/* Flecha atrás */}
      <button
        onClick={() => navigate("/register")}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 group transition-all duration-300 hover:scale-110"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Contenedor principal */}
      <div className="w-full max-w-6xl bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/10 mx-auto">
        <div className="flex flex-col lg:flex-row">

          {/* PANEL IZQUIERDO */}
          <div className="lg:w-1/2 bg-linear-to-br from-[#2C1A0E]/90 to-[#3D1F0F]/90 p-6 sm:p-8 md:p-10 lg:p-12 relative overflow-hidden hidden lg:block">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-8 md:mb-12 group">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-[#C8814A] to-[#E8A870] rounded-xl flex items-center justify-center text-xl md:text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    ☕
                  </div>
                  <span className="text-2xl md:text-3xl font-black text-white tracking-tight font-serif">
                    Coffe<span className="text-[#E8A870]">Price</span>
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight mb-4 md:mb-6 font-serif">
                  Un paso más <br />
                  <span className="text-[#E8A870] italic relative inline-block">
                    y listo
                    <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-linear-to-r from-[#E8A870] to-transparent rounded-full"></span>
                  </span>
                </h1>

                <p className="text-white/60 text-sm md:text-base leading-relaxed mb-6 md:mb-8 max-w-md">
                  Verifica tu correo para proteger tu cuenta y empezar a consultar los precios del café en tu municipio.
                </p>
              </div>

              <div className="flex gap-4 md:gap-6 flex-wrap">
                {[
                  { number: "+240", label: "Compradores", icon: "🏪" },
                  { number: "Gratis", label: "Caficultores", icon: "🆓" },
                ].map((stat, idx) => (
                  <div key={idx} className="text-center group">
                    <div className="flex items-center gap-2 justify-center mb-1">
                      <span className="text-lg md:text-xl opacity-60 group-hover:opacity-100 transition-opacity">{stat.icon}</span>
                      <p className="text-lg md:text-xl font-bold text-white font-serif">{stat.number}</p>
                    </div>
                    <p className="text-[10px] md:text-xs text-white/40 group-hover:text-white/60 transition-colors">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -top-24 -right-24 w-64 h-64 md:w-80 md:h-80 rounded-full bg-linear-to-br from-[#C8814A]/20 to-transparent blur-2xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 md:w-80 md:h-80 rounded-full bg-linear-to-tr from-[#C8814A]/10 to-transparent blur-2xl" />
          </div>

          {/* PANEL DERECHO */}
          <div className="w-full lg:w-1/2 bg-white p-5 sm:p-6 md:p-8 lg:p-10">

            {/* Logo móvil */}
            <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8 lg:hidden">
              <div className="w-10 h-10 bg-linear-to-br from-[#C8814A] to-[#E8A870] rounded-xl flex items-center justify-center text-xl shadow-lg">☕</div>
              <span className="text-2xl font-black text-[#3B1F0A] font-serif">Coffe<span className="text-[#C8814A]">Price</span></span>
            </div>

            {/* ── COMPRADOR PENDIENTE ── */}
            {pendiente ? (
              <div className="text-center py-8 px-4">
                <div className="w-20 h-20 rounded-2xl bg-[#C8814A]/10 flex items-center justify-center text-5xl mx-auto mb-6">⏳</div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#3B1F0A] mb-3 font-serif">¡Correo verificado!</h2>
                <p className="text-sm text-gray-400 leading-relaxed mb-8 max-w-sm mx-auto">
                  Tu cuenta de comprador fue verificada. Un administrador revisará tu perfil empresarial pronto y te notificará por correo.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-2.5 sm:py-3 rounded-xl text-white text-sm font-bold shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group bg-linear-to-r from-[#3D1F0F] to-[#7A4020] hover:from-[#4a2815] hover:to-[#8a4a28]"
                >
                  <span className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative">☕ Ir al inicio de sesión</span>
                </button>
              </div>

            ) : (
              /* ── FORMULARIO CÓDIGO ── */
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-[#C8814A]/10 flex items-center justify-center text-3xl mx-auto mb-4">✉️</div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#3B1F0A] mb-2 font-serif">Verifica tu correo</h2>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Enviamos un código de 6 dígitos a{" "}
                    <span className="font-semibold text-[#C8814A]">{maskEmail(email)}</span>
                  </p>
                </div>

                {/* Banner Kaffi */}
                <div className="rounded-2xl border border-[#E7D9BF] bg-[#FFF8EC] p-3">
                  <p className="text-sm font-semibold text-[#3B1F0A]">Kaffi le acompaña en este paso</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#7B5C3E]">
                    Si no le llega el código o no sabe qué hacer, Kaffi le explica con calma.
                  </p>
                  <button
                    type="button"
                    onClick={() => abrirGuiaKaffi("verify_email")}
                    className="mt-3 rounded-full bg-[#3D1F0F] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2C1A0E]"
                  >
                    Ayúdeme con el código
                  </button>
                </div>

                {/* Inputs del código */}
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="flex gap-2.5 sm:gap-3 justify-center" onPaste={handlePaste}>
                    {code.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => inputsRef.current[i] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleChange(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl font-black rounded-xl border-2 bg-gray-50/50 text-[#3B1F0A] focus:outline-none transition-all
                          ${digit ? "border-[#C8814A] bg-[#C8814A]/5" : "border-[#C8814A]/20"}
                          ${error ? "border-red-400 bg-red-50 animate-shake" : ""}
                          focus:border-[#C8814A] focus:ring-2 focus:ring-[#C8814A]/30 focus:bg-white`}
                      />
                    ))}
                  </div>

                  {error && (
                    <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
                      <span>❌</span> {error}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 text-center">
                    Revisa también tu carpeta de spam
                  </p>

                  <button
                    type="submit"
                    disabled={loading || !isCodeComplete}
                    className="w-full py-2.5 sm:py-3 rounded-xl text-white text-sm font-bold shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group bg-linear-to-r from-[#3D1F0F] to-[#7A4020] hover:from-[#4a2815] hover:to-[#8a4a28]"
                  >
                    <span className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verificando...
                        </>
                      ) : <>✉️ Verificar cuenta</>}
                    </span>
                  </button>
                </form>

                {/* Reenviar */}
                <div className="text-center pt-1">
                  <p className="text-xs text-gray-400 mb-1">¿No recibiste el código?</p>
                  {resendCooldown > 0 ? (
                    <p className="text-xs text-gray-400">
                      Puedes reenviar en{" "}
                      <span className="font-semibold text-[#C8814A]">{resendCooldown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading}
                      className="text-xs font-semibold text-[#C8814A] hover:text-[#7A4020] transition-colors hover:underline disabled:opacity-60"
                    >
                      {resendLoading ? "Reenviando..." : "Reenviar código"}
                    </button>
                  )}
                </div>

                <div className="text-center text-[9px] sm:text-[10px] text-gray-500 mt-2">
                  © 2024 CoffePrice - Todos los derechos reservados
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-500 { animation-delay: 0.5s; }
        @media (min-width: 480px) { .xs\\:flex-row { flex-direction: row; } }
      `}</style>
    </div>
  );
}
