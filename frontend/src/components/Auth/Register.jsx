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
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ nombre, apellido, email, password, celular, rol: tipo }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

      navigate("/verify-email", { state: { email, tipo } });

    } catch {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F0E8D5] flex items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">
      
      {/* Granos de café decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-5 left-5 text-4xl sm:text-6xl md:text-7xl lg:text-8xl opacity-5 animate-bounce">🫘</div>
        <div className="absolute bottom-5 right-5 text-5xl sm:text-7xl md:text-8xl lg:text-9xl opacity-5 animate-bounce animation-delay-1000">🫘</div>
        <div className="absolute top-1/4 left-1/4 text-3xl sm:text-5xl md:text-6xl lg:text-7xl opacity-5 animate-pulse">☕</div>
        <div className="absolute bottom-1/4 right-1/4 text-3xl sm:text-5xl md:text-6xl lg:text-7xl opacity-5 animate-pulse animation-delay-500">🌿</div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-200 h-full max-h-200 rounded-full bg-[#C8814A]/5 blur-3xl" />
      </div>

      {/* Flecha salir */}
      <a 
        href="/" 
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 group transition-all duration-300 hover:scale-110"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-5 h-5 sm:w-6 sm:h-6 text-black">
          <path d="M224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L160 96C107 96 64 139 64 192L64 448C64 501 107 544 160 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480C142.3 480 128 465.7 128 448L128 192C128 174.3 142.3 160 160 160L224 160zM566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L438.6 169.3C426.1 156.8 405.8 156.8 393.3 169.3C380.8 181.8 380.8 202.1 393.3 214.6L466.7 288L256 288C238.3 288 224 302.3 224 320C224 337.7 238.3 352 256 352L466.7 352L393.3 425.4C380.8 437.9 380.8 458.2 393.3 470.7C405.8 483.2 426.1 483.2 438.6 470.7L566.6 342.7z" fill="currentColor"/>
        </svg>
      </a>

      {/* Contenedor principal */}
      <div className="w-full max-w-6xl bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/10 mx-auto">
        
        <div className="flex flex-col lg:flex-row">
          
          {/* PANEL IZQUIERDO - Hero */}
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
                  Únete a <br />
                  <span className="text-[#E8A870] italic relative inline-block">
                    CoffePrice
                    <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-linear-to-r from-[#E8A870] to-transparent rounded-full"></span>
                  </span>
                </h1>

                <p className="text-white/60 text-sm md:text-base leading-relaxed mb-6 md:mb-8 max-w-md">
                  Crea tu cuenta gratis y empieza a consultar los mejores precios del café en tu municipio.
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

          {/* PANEL DERECHO - Formulario */}
          <div className="w-full lg:w-1/2 bg-white p-5 sm:p-6 md:p-8 lg:p-10">
            
            {/* Logo móvil */}
            <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8 lg:hidden">
              <div className="w-10 h-10 bg-linear-to-br from-[#C8814A] to-[#E8A870] rounded-xl flex items-center justify-center text-xl shadow-lg">
                ☕
              </div>
              <span className="text-2xl font-black text-[#3B1F0A] font-serif">
                Coffe<span className="text-[#C8814A]">Price</span>
              </span>
            </div>

            <div className="text-center mb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-[#3B1F0A] mb-2 font-serif">Crea tu cuenta</h2>
              <p className="text-xs sm:text-sm text-gray-400">Gratis para caficultores. En menos de 2 minutos.</p>
            </div>

            {/* Selector de tipo de usuario */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {[
                { val: "productor", ico: "👨‍🌾", nombre: "Productor", desc: "Vendo mi café" },
                { val: "comprador", ico: "🏪", nombre: "Comprador", desc: "Compro café" },
              ].map(({ val, ico, nombre, desc }) => (
                <button key={val} type="button" onClick={() => setTipo(val)}
                  className={`py-3.5 px-3 rounded-xl border-2 text-center transition-all ${
                    tipo === val 
                      ? "border-[#C8814A] bg-[#C8814A]/5 shadow-md" 
                      : "border-[#C8814A]/20 bg-white hover:border-[#C8814A]/50 hover:bg-gray-50"
                  }`}>
                  <div className="text-2xl sm:text-3xl mb-1.5">{ico}</div>
                  <div className="text-sm font-bold text-[#3B1F0A]">{nombre}</div>
                  <div className="text-xs text-[#7B5C3E] mt-0.5">{desc}</div>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3B1F0A] mb-2 uppercase tracking-wide">Nombre</label>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#C8814A] transition-colors">👤</span>
                    <input type="text" placeholder="Tu nombre" required value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 sm:py-3 rounded-xl border border-[#C8814A]/20 bg-gray-50/50 text-sm text-[#3B1F0A] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/30 focus:border-[#C8814A] focus:bg-white transition-all"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3B1F0A] mb-2 uppercase tracking-wide">Apellido</label>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#C8814A] transition-colors">👤</span>
                    <input type="text" placeholder="Tu apellido" required value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 sm:py-3 rounded-xl border border-[#C8814A]/20 bg-gray-50/50 text-sm text-[#3B1F0A] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/30 focus:border-[#C8814A] focus:bg-white transition-all"/>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2 uppercase tracking-wide">Correo electrónico</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#C8814A] transition-colors">📧</span>
                  <input type="email" placeholder="tucorreo@ejemplo.com" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 sm:py-3 rounded-xl border border-[#C8814A]/20 bg-gray-50/50 text-sm text-[#3B1F0A] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/30 focus:border-[#C8814A] focus:bg-white transition-all"/>
                </div>
              </div>

              {/* Celular */}
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2 uppercase tracking-wide">
                  Celular <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#C8814A] transition-colors">📱</span>
                  <input type="tel" placeholder="+57 300 000 0000" value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 sm:py-3 rounded-xl border border-[#C8814A]/20 bg-gray-50/50 text-sm text-[#3B1F0A] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/30 focus:border-[#C8814A] focus:bg-white transition-all"/>
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2 uppercase tracking-wide">Contraseña</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#C8814A] transition-colors">🔒</span>
                  <input type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres"
                    value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                    className="w-full pl-9 pr-10 py-2.5 sm:py-3 rounded-xl border border-[#C8814A]/20 bg-gray-50/50 text-sm text-[#3B1F0A] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/30 focus:border-[#C8814A] focus:bg-white transition-all"/>
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C8814A] transition-colors">
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2 uppercase tracking-wide">Confirmar contraseña</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#C8814A] transition-colors">✓</span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full pl-9 pr-10 py-2.5 sm:py-3 rounded-xl border bg-gray-50/50 text-sm text-[#3B1F0A] placeholder:text-gray-300 focus:outline-none focus:ring-2 transition-all ${
                      passwordsMismatch
                        ? "border-red-400 focus:ring-red-300"
                        : passwordsMatch
                        ? "border-green-400 focus:ring-green-300"
                        : "border-[#C8814A]/20 focus:ring-[#C8814A]/30 focus:border-[#C8814A] focus:bg-white"
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C8814A] transition-colors">
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

              {/* Términos */}
              <label className="flex items-start gap-2.5 mb-2 cursor-pointer">
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

              {error && (
                <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
                  <span>❌</span> {error}
                </div>
              )}

              {/* Botón submit */}
              <button type="submit" disabled={loading || passwordsMismatch}
                className="w-full py-2.5 sm:py-3 rounded-xl text-white text-sm font-bold shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group bg-linear-to-r from-[#3D1F0F] to-[#7A4020] hover:from-[#4a2815] hover:to-[#8a4a28]">
                <span className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando código...
                    </>
                  ) : (
                    <>☕️ Crear cuenta</>
                  )}
                </span>
              </button>

              {/* Separador */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E0D8CE]"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-gray-400">o continúa con</span>
                </div>
              </div>

              {/* Botón Google */}
              <button
                type="button"
                onClick={() => { window.location.href = `${API_URL}/api/auth/google?rol=${tipo}` }}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 py-2.5 sm:py-3 rounded-xl border-2 border-[#C8814A]/20 bg-white text-xs sm:text-sm font-semibold text-[#3B1F0A] hover:bg-[#C8814A]/5 hover:border-[#C8814A]/40 transition-all duration-300 group"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continuar con Google como {tipo === 'productor' ? '👨‍🌾 Productor' : '🏪 Comprador'}</span>
              </button>

              {/* Login link */}
              <div className="text-center pt-2">
                <p className="text-xs sm:text-sm text-gray-500">
                  ¿Ya tienes cuenta?{" "}
                  <button type="button" onClick={() => navigate("/login")}
                    className="font-semibold text-[#C8814A] hover:text-[#7A4020] transition-colors hover:underline">
                    Inicia sesión
                  </button>
                </p>
              </div>
            </form>

            {/* Copyright */}
            <div className="text-center text-[9px] sm:text-[10px] text-gray-300 mt-6">
              © 2024 CoffePrice - Todos los derechos reservados
            </div>
          </div>
        </div>
      </div>

      {/* Estilos adicionales */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        @media (min-width: 480px) {
          .xs\\:flex-row {
            flex-direction: row;
          }
        }
      `}</style>
    </div>
  );
}