import { useState } from "react";

export default function Login () {
    const [ showPassword, setShowPassword ] = useState(false);

    const handleSubmit = (e) => {    // 👈 aquí
        e.preventDefault();
        console.log("Iniciando sesión...");
      };
    return (

         <div className="flex min-h-screen bg-[#3B1F0A]">

      {/* PANEL IZQUIERDO */}
      <div className="flex-1 hidden lg:flex flex-col justify-center px-56 py-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #3B1F0A 0%, #5C2E0E 60%, #7A4020 100%)" }}>

        {/* Decoración fondo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(200,129,74,0.15) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-20 left-10 w-72 h-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(200,129,74,0.08) 0%, transparent 70%)" }} />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-16 relative z-10">
          <div className="w-12 h-12 bg-[#C8814A] rounded-xl flex items-center justify-center text-2xl shadow-lg">
            ☕
          </div>
          <span className="text-5xl font-black text-white" style={{ fontFamily: "Georgia, serif" }}>
            CoffePrice
          </span>
        </div>

        {/* Título */}
        <h1 className="text-6xl font-black text-white leading-tight mb-5 relative z-10"
          style={{ fontFamily: "Georgia, serif" }}>
          Tu café merece <br />
          <span className="text-[#E8A870] italic text-6xl">el mejor precio</span>
        </h1>

        {/* Descripción */}
        <p className="text-white/65 text-2xl leading-relaxed max-w-sm mb-14 relative z-10">
          Entra a CoffePrice y consulta en segundos cuánto pagan los compradores
          de tu municipio sin intermediarios.
        </p>

        {/* Stats */}
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
      <div className="w-full lg:w-206 bg-[#FAF7F2] flex flex-col justify-center px-10 py-12 shrink-0">

        {/* Tab switcher */}
        <div className="bg-white rounded-xl p-1 flex mb-9 shadow-sm">
          <button className="flex-1 py-2.5 rounded-lg bg-[#3B1F0A] text-white text-sm font-semibold">
            Iniciar sesión
          </button>
          <button className="flex-1 py-2.5 rounded-lg text-gray-400 text-sm font-semibold">
            Crear cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit}>

        {/* Título */}
        <h2 className="text-3xl font-black text-[#3B1F0A] mb-1.5" style={{ fontFamily: "Georgia, serif" }}>
          ¡Bienvenido de nuevo!
        </h2>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          Entra a tu cuenta para ver los precios de tu zona
        </p>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
            Correo electrónico
          </label>
          <input
            type="email"
            placeholder="tucorreo@gmail.com"
            required
            className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50"
          />
        </div>

        {/* Contraseña */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
            Contraseña
          </label>
          <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Tu contraseña"
            required
            className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50"
          />
          <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C8814A] transition-colors"
          >
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

        {/* Recordar / Olvidé */}
        <div className="flex justify-between items-center mb-6">
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input type="checkbox" className="accent-[#C8814A] w-3.5 h-3.5" />
            Recordarme
          </label>
          <a href="#" className="text-xs text-[#C8814A] font-semibold hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {/* Botón principal */}
        <button
        type="submit"
          className="w-full py-3.5 rounded-xl text-white text-sm font-bold mb-5 shadow-lg hover:scale-[1.02] transition-transform"
          style={{ background: "linear-gradient(135deg, #C8814A, #7A4020)" }}>
          ☕️  Iniciar sesión
        </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4 text-xs text-gray-400">
          <div className="flex-1 h-px bg-[#E0D8CE]" />
          o continúa con
          <div className="flex-1 h-px bg-[#E0D8CE]" />
        </div>

        {/* Social */}
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#C8814A]/25 bg-white text-xs font-semibold text-[#3B1F0A] hover:bg-[#C8814A]/5 transition">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
        </div>

      </div>
    </div>
                    
    );
}

