import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const [tipo, setTipo] = useState("productor");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terminos, setTerminos] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function getStrength(val) {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return score;
  }

  const strength = getStrength(password);
  const strengthLabels = ["", "Contraseña débil", "Contraseña regular", "Contraseña buena", "Contraseña muy segura"];
  const strengthColors = ["", "text-red-500", "text-yellow-500", "text-green-500", "text-green-700"];
  const segActive = ["bg-red-500", "bg-yellow-500", "bg-green-500", "bg-green-700"];

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!terminos) {
      alert("Por favor acepta los términos de uso para continuar.");
      return;
    }
    if (password.length < 8) return;
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // Llamamos al endpoint que registra el usuario con estado "pendiente"
      // y envía el código de verificación al correo
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, apellido, email, password, celular, rol: tipo }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

      // Redirigimos a la página de verificación pasando el email por state
      navigate("/verify-email", { state: { email, tipo } });

    } catch {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#3D1F0F]">

      {/* Flecha salir */}
      <a href="/" className="absolute top-4 right-4 z-50 bg-[#3D1F0F]/60 p-2 rounded-full lg:bg-transparent lg:p-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-6 h-6 lg:w-7 lg:h-7">
          <path d="M224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L160 96C107 96 64 139 64 192L64 448C64 501 107 544 160 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480C142.3 480 128 465.7 128 448L128 192C128 174.3 142.3 160 160 160L224 160zM566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L438.6 169.3C426.1 156.8 405.8 156.8 393.3 169.3C380.8 181.8 380.8 202.1 393.3 214.6L466.7 288L256 288C238.3 288 224 302.3 224 320C224 337.7 238.3 352 256 352L466.7 352L393.3 425.4C380.8 437.9 380.8 458.2 393.3 470.7C405.8 483.2 426.1 483.2 438.6 470.7L566.6 342.7z"/>
        </svg>
      </a>

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
          Tu café merece <br />
          <span className="text-[#E8A870] italic text-6xl">el mejor precio</span>
        </h1>

        <p className="text-white/65 text-2xl leading-relaxed max-w-sm mb-14 relative z-10">
          Entra a CoffePrice y consulta en segundos cuánto pagan los compradores de tu municipio.
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
      <div className="w-full lg:w-[780px] bg-[#FAF7F2] flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 shrink-0 overflow-y-auto">

        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="w-10 h-10 bg-[#C8814A] rounded-xl flex items-center justify-center text-xl shadow-lg">☕</div>
          <span className="text-3xl font-black text-[#3B1F0A]" style={{ fontFamily: "Georgia, serif" }}>CoffePrice</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-[#3B1F0A] mb-1.5" style={{ fontFamily: "Georgia, serif" }}>
          Crea tu cuenta
        </h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Gratis para caficultores. En menos de 2 minutos.
        </p>

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {[
            { val: "productor", ico: "👨‍🌾", nombre: "Productor", desc: "Vendo mi café" },
            { val: "comprador", ico: "🏪", nombre: "Comprador", desc: "Compro café" },
          ].map(({ val, ico, nombre, desc }) => (
            <button key={val} type="button" onClick={() => setTipo(val)}
              className={`py-3.5 px-3 rounded-2xl border-2 text-center transition-all ${
                tipo === val ? "border-[#C8814A] bg-[#C8814A]/5" : "border-[#C8814A]/20 bg-white hover:border-[#C8814A]/50"
              }`}>
              <div className="text-3xl mb-1.5">{ico}</div>
              <div className="text-sm font-bold text-[#3B1F0A]">{nombre}</div>
              <div className="text-xs text-[#7B5C3E] mt-0.5">{desc}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Nombre</label>
              <input type="text" placeholder="Tu nombre" required value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 transition-all"/>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Apellido</label>
              <input type="text" placeholder="Tu apellido" required value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 transition-all"/>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Correo electrónico</label>
            <input type="email" placeholder="tucorreo@ejemplo.com" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 transition-all"/>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
              Celular <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input type="tel" placeholder="+57 300 000 0000" value={celular}
              onChange={(e) => setCelular(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 transition-all"/>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Contraseña</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 transition-all"/>
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C8814A] transition-colors">
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {password.length > 0 && (
              <>
                <div className="flex gap-1.5 mt-2">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? segActive[strength - 1] : "bg-[#C8814A]/15"}`} />
                  ))}
                </div>
                <p className={`text-xs font-semibold mt-1.5 ${strengthColors[strength]}`}>
                  {strengthLabels[strength]}
                </p>
              </>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Confirmar contraseña</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className={`w-full pl-4 pr-12 py-3 rounded-xl border bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 transition-all ${
                  passwordsMismatch
                    ? "border-red-400 focus:ring-red-300"
                    : passwordsMatch
                    ? "border-green-400 focus:ring-green-300"
                    : "border-[#C8814A]/30 focus:ring-[#C8814A]/50"
                }`}
              />
              <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C8814A] transition-colors">
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {passwordsMismatch && (
              <p className="text-xs font-semibold mt-1.5 text-red-500">❌ Las contraseñas no coinciden</p>
            )}
            {passwordsMatch && (
              <p className="text-xs font-semibold mt-1.5 text-green-600">✅ Las contraseñas coinciden</p>
            )}
          </div>

          <label className="flex items-start gap-2.5 mb-3 cursor-pointer">
            <input type="checkbox" checked={terminos} onChange={e => setTerminos(e.target.checked)}
              className="accent-[#C8814A] w-3.5 h-3.5 mt-0.5 shrink-0"/>
            <span className="text-xs text-gray-500">
              Acepto los{" "}
              <a href="#" className="text-[#C8814A] font-semibold hover:underline">Términos de uso</a>
              {" "}y la{" "}
              <a href="#" className="text-[#C8814A] font-semibold hover:underline">Política de privacidad</a>
              {" "}de CoffePrice
            </span>
          </label>

          {error && <p className="text-red-500 text-xs mb-3">❌ {error}</p>}

          <button type="submit" disabled={loading || passwordsMismatch}
            className="w-full py-3.5 rounded-xl text-white text-sm font-bold mb-4 shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ background: "linear-gradient(135deg, #3D1F0F, #7A4020)" }}>
            {loading ? "Enviando código..." : "Crear cuenta"}
          </button>

          <div className="flex items-center gap-3 my-4 text-xs text-gray-400">
            <div className="flex-1 h-px bg-[#E0D8CE]" />
            o continúa con
            <div className="flex-1 h-px bg-[#E0D8CE]" />
          </div>

          <button
            type="button"
            onClick={() => { window.location.href = `${API_URL}/api/auth/google?rol=${tipo}` }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#C8814A]/25 bg-white text-xs font-semibold text-[#3B1F0A] hover:bg-[#C8814A]/5 transition mb-5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google como {tipo === 'productor' ? '👨‍🌾 Productor' : '🏪 Comprador'}
          </button>

        </form>

        <p className="text-center text-xs text-gray-400">
          ¿Ya tienes cuenta?{" "}
          <button type="button" onClick={() => navigate("/login")}
            className="font-semibold text-[#C8814A] hover:text-[#7A4020] transition-colors">
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
}