import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContex.jsx";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = import.meta.env.VITE_API_URL;
  const { login } = useAuth();

  const email = location.state?.email || "";
  const tipo = location.state?.tipo || "productor";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [pendiente, setPendiente] = useState(false); // comprador esperando aprobación

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
    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
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

      // Comprador verificado → pendiente de aprobación admin
      if (data.pendiente) {
        setPendiente(true);
        return;
      }

      // Productor verificado → iniciamos sesión automáticamente y navegamos
      login(data.token, data.role, data.name, data.apellido, data.id, data.celular, data.email);
      navigate("/precios", { replace: true });

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

      if (!response.ok) {
        setError(data.message || "No se pudo reenviar el código.");
        return;
      }

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
    <div className="flex min-h-screen bg-[#3D1F0F]">

      {/* Flecha atrás */}
      <button
        onClick={() => navigate("/register")}
        className="absolute top-4 left-4 z-50 bg-[#3D1F0F]/60 p-2 rounded-full lg:bg-transparent lg:p-0 text-white/60 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* PANEL IZQUIERDO */}
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
          Un paso más <br />
          <span className="text-[#E8A870] italic text-6xl">y listo</span>
        </h1>

        <p className="text-white/65 text-2xl leading-relaxed max-w-sm mb-14 relative z-10">
          Verifica tu correo para proteger tu cuenta y empezar a consultar precios.
        </p>

        <div className="flex gap-12 relative z-10">
          <div>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>+240</p>
            <p className="text-sm text-white/55 mt-1">Compradores</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>12</p>
            <p className="text-sm text-white/55 mt-1">Municipios</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Gratis</p>
            <p className="text-sm text-white/55 mt-1">Caficultores</p>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="w-full lg:w-[780px] bg-[#FAF7F2] flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 shrink-0">

        {/* ── COMPRADOR PENDIENTE ── */}
        {pendiente ? (
          <div className="text-center py-8 px-4">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#3B1F0A] mb-3" style={{ fontFamily: "Georgia, serif" }}>
              ¡Correo verificado!
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">
              Tu cuenta de comprador fue verificada. Un administrador revisará tu perfil empresarial pronto y te notificará.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3.5 rounded-xl text-white text-sm font-bold shadow-lg hover:scale-[1.02] transition-transform"
              style={{ background: "linear-gradient(135deg, #C8814A, #7A4020)" }}
            >
              ☕ Ir al inicio de sesión
            </button>
          </div>

        ) : (
          /* ── FORMULARIO CÓDIGO ── */
          <>
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div className="w-10 h-10 bg-[#C8814A] rounded-xl flex items-center justify-center text-xl shadow-lg">☕</div>
              <span className="text-3xl font-black text-[#3B1F0A]" style={{ fontFamily: "Georgia, serif" }}>CoffePrice</span>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-[#C8814A]/10 flex items-center justify-center text-4xl mb-6">
              ✉️
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#3B1F0A] mb-2" style={{ fontFamily: "Georgia, serif" }}>
              Verifica tu correo
            </h2>
            <p className="text-sm text-gray-400 mb-1 leading-relaxed">
              Enviamos un código de 6 dígitos a
            </p>
            <p className="text-sm font-semibold text-[#C8814A] mb-8">
              {maskEmail(email)}
            </p>

            <form onSubmit={handleVerify}>
              <div className="flex gap-2.5 sm:gap-3 mb-2 justify-center" onPaste={handlePaste}>
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
                    className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl font-black rounded-xl border-2 bg-white text-[#3B1F0A] focus:outline-none transition-all
                      ${digit ? "border-[#C8814A] bg-[#C8814A]/5" : "border-[#C8814A]/25"}
                      ${error ? "border-red-400 bg-red-50" : ""}
                      focus:border-[#C8814A] focus:ring-2 focus:ring-[#C8814A]/30`}
                    style={{ fontSize: "1.4rem" }}
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-500 text-xs font-semibold text-center mb-4 mt-2">
                  ❌ {error}
                </p>
              )}

              <p className="text-xs text-gray-400 text-center mb-6 mt-3">
                Revisa también tu carpeta de spam
              </p>

              <button
                type="submit"
                disabled={loading || !isCodeComplete}
                className="w-full py-3.5 rounded-xl text-white text-sm font-bold mb-4 shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ background: "linear-gradient(135deg, #3D1F0F, #7A4020)" }}
              >
                {loading ? "Verificando..." : "Verificar cuenta"}
              </button>
            </form>

            <div className="text-center">
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
                  className="text-xs font-semibold text-[#C8814A] hover:text-[#7A4020] transition-colors disabled:opacity-60"
                >
                  {resendLoading ? "Reenviando..." : "Reenviar código"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}