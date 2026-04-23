import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';

export default function Login() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Para recibir cookie si el backend la envía
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

<<<<<<< bacnkendddd
      login(data.user);
      setSuccess(`¡Bienvenido, ${data.name}! 👋🏻`);

      setTimeout(async () => {
        if (data.role === "admin") {
          navigate("/admin/perfil");
        } else if (data.role === "comprador") {
          try {
            const res = await fetch(`${API_URL}/api/comprador/usuario/${data.id}`, {
              headers: { Authorization: `Bearer ${data.token}` }
            });
            if (res.ok) {
              navigate("/comprador/dashboard");
            } else {
              navigate("/completar-perfil");
            }
          } catch {
            navigate("/completar-perfil");
          }
        } else {
          navigate("/precios");
        }
      }, 1500);
=======
      login(data.token, data.role, data.name, data.apellido, data.id, data.celular, data.email);

      setSuccess(`¡Bienvenido, ${data.user?.nombre || ""}! 👋🏻`);

      setTimeout(() => {
        if (data.user?.rol === "admin") navigate("/admin/perfil");
        else if (data.user?.rol === "comprador") navigate("/comprador/dashboard");
        else navigate("/precios");
      }, 1500)
>>>>>>> main

    } catch {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">

      <a href="/"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="absolute top-4 right-4 w-7 h-7 ">
        <path d="M224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L160 96C107 96 64 139 64 192L64 448C64 501 107 544 160 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480C142.3 480 128 465.7 128 448L128 192C128 174.3 142.3 160 160 160L224 160zM566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L438.6 169.3C426.1 156.8 405.8 156.8 393.3 169.3C380.8 181.8 380.8 202.1 393.3 214.6L466.7 288L256 288C238.3 288 224 302.3 224 320C224 337.7 238.3 352 256 352L466.7 352L393.3 425.4C380.8 437.9 380.8 458.2 393.3 470.7C405.8 483.2 426.1 483.2 438.6 470.7L566.6 342.7z" />
      </svg>
      </a>

<<<<<<< bacnkendddd
      {/* Contenedor principal */}
      <div className="w-full max-w-6xl bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/10 mx-auto">
        
        <div className="flex flex-col lg:flex-row">
          
          {/* Panel izquierdo */}
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
                  Tu café merece <br />
                  <span className="text-[#E8A870] italic relative inline-block">
                    el mejor precio
                    <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-linear-to-r from-[#E8A870] to-transparent rounded-full"></span>
                  </span>
                </h1>
=======
      {/* PANEL IZQUIERDO */}
      <div className="flex-1 hidden lg:flex flex-col justify-center pl-20 px-16 py-12 relative overflow-hidden bg-[#3D1F0F]">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(200,129,74,0.15) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-20 left-10 w-72 h-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(200,129,74,0.08) 0%, transparent 70%)" }} />

        <div className="flex items-center gap-3 mb-16 relative z-10">
          <div className="w-12 h-12 bg-[#C8814A] rounded-xl flex items-center justify-center text-2xl shadow-lg">☕</div>
          <span className="text-5xl font-black text-white" style={{ fontFamily: "Georgia, serif" }}>CoffePrice</span>
        </div>
>>>>>>> main

        <h1 className="text-6xl font-black text-white leading-tight mb-5 relative z-10" style={{ fontFamily: "Georgia, serif" }}>
          Tu café merece <br />
          <span className="text-[#E8A870] italic text-6xl">el mejor precio</span>
        </h1>

<<<<<<< bacnkendddd
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
=======
        <p className="text-white/65 text-2xl leading-relaxed max-w-sm mb-14 relative z-10">
          Entra a CoffePrice y consulta en segundos cuánto pagan los compradores de tu municipio.
        </p>

        <div className="flex gap-12 relative z-10">
          <div>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>+240</p>
            <p className="text-sm text-white/55 mt-1">Compradores</p>
>>>>>>> main
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

<<<<<<< bacnkendddd
          {/* Panel derecho - Formulario */}
          <div className="w-full lg:w-1/2 bg-white p-5 sm:p-6 md:p-8 lg:p-10">
            
            <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8 lg:hidden">
              <div className="w-10 h-10 bg-linear-to-br from-[#C8814A] to-[#E8A870] rounded-xl flex items-center justify-center text-xl shadow-lg">
                ☕
              </div>
              <span className="text-2xl font-black text-[#3B1F0A] font-serif">
                Coffe<span className="text-[#C8814A]">Price</span>
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="text-center mb-4">
                <h2 className="text-2xl sm:text-3xl font-black text-[#3B1F0A] mb-2 font-serif">¡Bienvenido!</h2>
                <p className="text-xs sm:text-sm text-gray-400">Entra a tu cuenta para ver los precios de tu zona</p>
              </div>
=======
      {/* PANEL DERECHO */}
      <div className="w-full lg:w-220 bg-[#FAF7F2] flex flex-col justify-center px-6 py-12 sm:px- shrink-0">

        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="w-10 h-10 bg-[#C8814A] rounded-xl flex items-center justify-center text-xl shadow-lg">☕</div>
          <span className="text-3xl font-black text-[#3B1F0A]" style={{ fontFamily: "Georgia, serif" }}>CoffePrice</span>
        </div>
>>>>>>> main


<<<<<<< bacnkendddd
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2 uppercase tracking-wide">
                  Correo electrónico
                </label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#C8814A] transition-colors text-sm">
                    📧
                  </span>
                  <input
                    data-kaffi="login-email"
                    type="email"
                    placeholder="tucorreo@gmail.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 sm:py-3 rounded-xl border border-[#C8814A]/20 bg-gray-50/50 text-sm text-[#3B1F0A] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/30 focus:border-[#C8814A] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2 uppercase tracking-wide">
                  Contraseña
                </label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#C8814A] transition-colors text-sm">
                    🔒
                  </span>
                  <input
                    data-kaffi="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contraseña"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 sm:py-3 rounded-xl border border-[#C8814A]/20 bg-gray-50/50 text-sm text-[#3B1F0A] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/30 focus:border-[#C8814A] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C8814A] transition-colors"
                  >
=======
        <form onSubmit={handleSubmit}>
          <h2 className="text-3xl font-black text-[#3B1F0A] mb-1.5" style={{ fontFamily: "Georgia, serif" }}>
            ¡Bienvenido!
          </h2>
          <p className="text-sm text-gray-400 mb-8 leading-relaxed">
            Entra a tu cuenta para ver los precios de tu zona
          </p>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Correo electrónico</label>
            <input
              type="email"
              placeholder="tucorreo@gmail.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Tu contraseña"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A]"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C8814A] transition-colors">
>>>>>>> main
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
<<<<<<< bacnkendddd
                </div>
              </div>

              <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 xs:gap-0">
                <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer group">
                  <input type="checkbox" className="accent-[#C8814A] w-3.5 h-3.5 rounded cursor-pointer" />
                  <span className="group-hover:text-[#3B1F0A] transition-colors">Recordarme</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-[#C8814A] font-semibold hover:text-[#7A4020] transition-colors hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {error && (
                <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2 animate-shake">
                  <span>❌</span> {error}
                </div>
              )}
              {success && (
                <div className="px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-600 text-xs font-semibold flex items-center gap-2">
                  <span>✅</span> {success}
                </div>
              )}

              <button
                data-kaffi="login-submit"
                type="submit"
                disabled={loading}
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
                      Iniciando sesión...
                    </>
                  ) : (
                    <>☕️ Iniciar sesión</>
                  )}
                </span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E0D8CE]"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-gray-400">o continúa con</span>
                </div>
              </div>

=======
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input type="checkbox" className="accent-[#C8814A] w-3.5 h-3.5" />
              Recordarme
            </label>
            <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-black font-semibold hover:underline cursor-pointer">
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          {success && <p className="text-green-600 text-xs mb-3">✅ {success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white text-sm font-bold mb-5 shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #3D1F0F, #7A4020)" }}
          >
            {loading ? "Iniciando sesión..." : "☕️ Iniciar sesión"}
          </button>

          {/* SEPARADOR */}
          <div className="flex items-center gap-3 my-4 text-xs text-gray-400">
            <div className="flex-1 h-px bg-[#E0D8CE]" />
            o continúa con
            <div className="flex-1 h-px bg-[#E0D8CE]" />
          </div>
          
          {/* BOTÓN GOOGLE */}
          <button
            type="button"
            onClick={() => {
              window.location.href = `${API_URL}/api/auth/google?rol=productor`
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#C8814A]/25 bg-white text-xs font-semibold text-[#3B1F0A] hover:bg-[#C8814A]/5 transition mb-5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          {/* BLOQUE REGISTRO */}
          <div className="text-center mt-2">
            <p className="text-sm text-gray-500">
              ¿No tienes cuenta?{" "}
>>>>>>> main
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-semibold text-[#C8814A] hover:text-[#7A4020] transition-colors"
              >
                Crear una cuenta gratis
              </button>
            </p>
          </div>

<<<<<<< bacnkendddd
              <div className="text-center pt-2">
                <p className="text-xs sm:text-sm text-gray-500">
                  ¿No tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="font-semibold text-[#C8814A] hover:text-[#7A4020] transition-colors hover:underline"
                  >
                    Crear una cuenta gratis
                  </button>
                </p>
              </div>
            </form>

            <div className="text-center text-[9px] sm:text-[10px] text-gray-500 mt-6">
              © 2024 CoffePrice - Todos los derechos reservados
            </div>
          </div>
        </div>
      </div>

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
=======
        </form>

      </div>
>>>>>>> main
    </div>
  );
}


