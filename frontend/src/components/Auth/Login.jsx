import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContex.jsx';

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
    console.log("Iniciando sesion...");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

      login(data.token, data.role, data.name, data.apellido, data.id );

      setSuccess(`¡Bienvenido, ${data.name}! 👋🏻`);

      setTimeout(() => {
        if (data.role === "admin") navigate("/admin");
        else if (data.role === "comprador") navigate("/comprador/dashboard");
        else if (data.role === "productor") navigate("/precios");
        else navigate("/");
      }, 1500)

    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#3D1F0F]">

      <a href="/"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="absolute top-4 right-4 w-7 h-7 ">
        <path d="M224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L160 96C107 96 64 139 64 192L64 448C64 501 107 544 160 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480C142.3 480 128 465.7 128 448L128 192C128 174.3 142.3 160 160 160L224 160zM566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L438.6 169.3C426.1 156.8 405.8 156.8 393.3 169.3C380.8 181.8 380.8 202.1 393.3 214.6L466.7 288L256 288C238.3 288 224 302.3 224 320C224 337.7 238.3 352 256 352L466.7 352L393.3 425.4C380.8 437.9 380.8 458.2 393.3 470.7C405.8 483.2 426.1 483.2 438.6 470.7L566.6 342.7z" />
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
          Entra a CoffePrice y consulta en segundos cuánto pagan los compradores de tu municipio sin intermediarios.
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
      <div className="w-full lg:w-[780px] bg-[#FAF7F2] flex flex-col justify-center px-6 py-12 sm:px- shrink-0 ">

        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="w-10 h-10 bg-[#C8814A] rounded-xl flex items-center justify-center text-xl shadow-lg">☕</div>
          <span className="text-3xl font-black text-[#3B1F0A]" style={{ fontFamily: "Georgia, serif" }}>CoffePrice</span>
        </div>


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

          {/* 🔽 NUEVO: SEPARADOR */}
          <div className="flex items-center gap-3 my-4 text-xs text-gray-400">
            <div className="flex-1 h-px bg-[#E0D8CE]" />
            o continúa con
            <div className="flex-1 h-px bg-[#E0D8CE]" />
          </div>
          {/* 🔽 NUEVO: BOTÓN GOOGLE */}
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

          {/* NUEVO BLOQUE REGISTRO */}
          <div className="text-center mt-2">
            <p className="text-sm text-gray-500">
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-semibold text-[#C8814A] hover:text-[#7A4020] transition-colors"
              >
                Crear una cuenta gratis
              </button>
            </p>
          </div>

        </form>

      </div>
    </div>
  );
}
