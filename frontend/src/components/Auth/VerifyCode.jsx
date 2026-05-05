import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
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

export default function VerifyCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [code, setCode]                   = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [message, setMessage]             = useState({ type: "", text: "" });

  const API_URL  = import.meta.env.VITE_API_URL;
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!email) navigate("/forgot-password");
  }, [email, navigate]);

  function handleCodeChange(index, value) {
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !code[index] && index > 0)
      inputsRef.current[index - 1]?.focus();
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      setCode(pasted.split(""));
      inputsRef.current[5]?.focus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    const codigoCompleto = code.join("");

    if (codigoCompleto.length !== 6)
      return setMessage({ type: "error", text: "Debes ingresar el código completo de 6 dígitos." });
    if (newPassword.length < 6)
      return setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." });
    if (newPassword !== confirmPassword)
      return setMessage({ type: "error", text: "Las contraseñas no coinciden." });

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/recuperar/cambiar-password`, {
        email,
        codigo: codigoCompleto,
        nuevaPassword: newPassword,
      });
      setMessage({ type: "success", text: response.data.message || "¡Contraseña actualizada con éxito!" });
      setTimeout(() => navigate("/login"), 2500);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Error al cambiar la contraseña." });
    } finally {
      setLoading(false);
    }
  }

  if (!email) return null;

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "#F0E8D5" }}
    >

      {/* ── Tarjeta ── */}
      <div className="relative w-full max-w-md z-10">

        {/* Barra superior de marca */}
        <div className="h-10 w-full rounded-t-2xl" style={{ background: "linear-gradient(90deg,#3D1F0F,#C8814A,#E8A870)" }} />

        <div className="bg-white rounded-b-2xl shadow-2xl overflow-hidden" style={{ border: "1px solid #E7D9BF", borderTop: "none" }}>


          {/* ── Divider ── */}
          <div style={{ height: "1px", background: "#F5ECD7", margin: "0 2rem" }} />

          {/* ── Cuerpo ── */}
          <div className="px-8 pt-6 pb-8">

            {/* Encabezado */}
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
                  Verifica tu código
                </h2>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: "#8B6A4A" }}>
                  Enviado a{" "}
                  <span className="font-semibold" style={{ color: "#C8814A" }}>{email}</span>
                </p>
              </div>
            </div>

            {/* Tip */}
            <div
              className="rounded-xl px-4 py-3 mb-6 text-xs leading-relaxed"
              style={{ background: "#FFF8EC", borderLeft: "3px solid #C8814A", color: "#7B5C3E" }}
            >
              Puedes pegar el código directamente si lo copiaste del correo.
            </div>

            {/* ── 6 cajas OTP ── */}
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-3 text-center" style={{ color: "#3B1F0A" }}>
                Código de 6 dígitos
              </label>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => (inputsRef.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleCodeChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    className="text-center text-2xl font-black rounded-xl transition-all outline-none"
                    style={{
                      width: 46, height: 54,
                      border:      digit ? "2px solid #C8814A" : "1.5px solid #E7D9BF",
                      background:  digit ? "#FFF8EC"           : "#FDFAF5",
                      color:       "#3B1F0A",
                      boxShadow:   digit ? "0 0 0 3px rgba(200,129,74,0.12)" : "none",
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = "#C8814A";
                      e.target.style.boxShadow   = "0 0 0 3px rgba(200,129,74,0.15)";
                    }}
                    onBlur={e => {
                      if (!digit) {
                        e.target.style.borderColor = "#E7D9BF";
                        e.target.style.boxShadow   = "none";
                      }
                    }}
                  />
                ))}
              </div>
              {/* indicador de progreso de las cajas */}
              <div className="flex justify-center gap-1.5 mt-3">
                {code.map((d, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: d ? 16 : 6, height: 4,
                      background: d ? "#C8814A" : "#E7D9BF",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ── Nueva contraseña ── */}
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#3B1F0A" }}>
                Nueva contraseña
              </label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#C8A96E" }}>🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-3 text-sm rounded-xl transition-all outline-none"
                  style={{ border: "1.5px solid #E7D9BF", background: "#FDFAF5", color: "#3B1F0A" }}
                  onFocus={e => { e.target.style.borderColor = "#C8814A"; e.target.style.boxShadow = "0 0 0 3px rgba(200,129,74,0.12)"; e.target.style.background = "#fff"; }}
                  onBlur={e  => { e.target.style.borderColor = "#E7D9BF"; e.target.style.boxShadow = "none"; e.target.style.background = "#FDFAF5"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#C8A96E" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* barra de fortaleza */}
              {newPassword.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(n => (
                      <div
                        key={n}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: newPassword.length >= n * 2
                            ? n <= 1 ? "#EF4444" : n <= 2 ? "#F59E0B" : n <= 3 ? "#84CC16" : "#22C55E"
                            : "#E7D9BF"
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs mt-1" style={{ color: "#8B6A4A" }}>
                    {newPassword.length < 2 ? "Muy corta" : newPassword.length < 4 ? "Débil" : newPassword.length < 6 ? "Regular" : newPassword.length < 8 ? "Buena" : "Fuerte"}
                  </p>
                </div>
              )}
            </div>

            {/* ── Confirmar contraseña ── */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#3B1F0A" }}>
                Confirmar contraseña
              </label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#C8A96E" }}>🔒</span>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Escribe nuevamente la contraseña"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-3 text-sm rounded-xl transition-all outline-none"
                  style={{
                    border: confirmPassword && newPassword !== confirmPassword ? "1.5px solid #EF4444" : "1.5px solid #E7D9BF",
                    background: "#FDFAF5", color: "#3B1F0A",
                  }}
                  onFocus={e => { e.target.style.borderColor = "#C8814A"; e.target.style.boxShadow = "0 0 0 3px rgba(200,129,74,0.12)"; e.target.style.background = "#fff"; }}
                  onBlur={e  => {
                    e.target.style.borderColor = confirmPassword && newPassword !== confirmPassword ? "#EF4444" : "#E7D9BF";
                    e.target.style.boxShadow = "none"; e.target.style.background = "#FDFAF5";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#C8A96E" }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* coincidencia visual */}
              {confirmPassword.length > 0 && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: newPassword === confirmPassword ? "#16A34A" : "#DC2626" }}>
                  {newPassword === confirmPassword ? "✓ Las contraseñas coinciden" : "✗ No coinciden aún"}
                </p>
              )}
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

            {/* Botón cambiar */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold relative overflow-hidden group transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed mb-3"
              style={{ background: "linear-gradient(135deg,#3D1F0F,#7A4020)", color: "#F5ECD7" }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background = "linear-gradient(135deg,#4a2815,#8a4a28)")}
              onMouseLeave={e => !loading && (e.currentTarget.style.background = "linear-gradient(135deg,#3D1F0F,#7A4020)")}
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)" }} />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Cambiando contraseña...
                  </>
                ) : (
                  <>✓ Cambiar contraseña</>
                )}
              </span>
            </button>

            {/* Reenviar código */}
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ border: "1.5px solid #E7D9BF", color: "#7A4020", background: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,129,74,0.06)"; e.currentTarget.style.borderColor = "#C8814A"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#E7D9BF"; }}
            >
              <svg viewBox="0 0 512 512" fill="currentColor" width="13" height="13">
                <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 288 480 288c17.7 0 32-14.3 32-32s-14.3-32-32-32L109.3 224l137.4-137.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
              </svg>
              Reenviar código
            </button>
          </div>

          {/* Footer */}
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
