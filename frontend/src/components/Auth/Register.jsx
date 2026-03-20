import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [tipo, setTipo] = useState("productor");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [terminos, setTerminos] = useState(false);
  const [alertas, setAlertas] = useState(true);

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

  function handleSubmit(e) {
    e.preventDefault();
    if (!terminos) {
      alert("Por favor acepta los términos de uso para continuar.");
      return;
    }
    if (password.length < 8) return;
    setSuccess(true);
  }

  return (
    <div className="flex min-h-screen bg-[#3B1F0A]">

      {/* ── PANEL IZQUIERDO ── */}
      <div
        className="flex-1 hidden lg:flex flex-col justify-center px-16 py-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #3B1F0A 0%, #5C2E0E 60%, #7A4020 100%)" }}
      >
        {/* Decoraciones */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(200,129,74,0.15) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-20 left-10 w-72 h-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(200,129,74,0.08) 0%, transparent 70%)" }} />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-[#C8814A] rounded-xl flex items-center justify-center text-2xl shadow-lg">
              ☕
            </div>
            <span className="text-5xl font-black text-white" style={{ fontFamily: "Georgia, serif" }}>
              CoffePrice
            </span>
          </div>

          {/* Título */}
          <h1 className="text-6xl font-black text-white leading-tight mb-5" style={{ fontFamily: "Georgia, serif" }}>
            Tu café merece <br />
            <span className="text-[#E8A870] italic">el mejor precio</span>
          </h1>

          {/* Descripción */}
          <p className="text-white/65 text-2xl leading-relaxed max-w-sm mb-14">
            Entra a CoffePrice y consulta en segundos cuánto pagan los compradores
            de tu municipio sin intermediarios.
          </p>

          {/* Stats */}
          <div className="flex gap-12">
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
      </div>

      {/* ── PANEL DERECHO ── */}
      <div className="w-full lg:w-[680px] bg-[#FAF7F2] flex flex-col justify-center px-10 py-12 shrink-0 overflow-y-auto">

        {!success ? (
          <>
            {/* Tab switcher */}
            <div className="bg-white rounded-xl p-1 flex mb-9 shadow-sm">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex-1 py-2.5 rounded-lg text-gray-400 text-sm font-semibold hover:bg-[#C8814A]/5 transition-colors"
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 rounded-lg bg-[#3B1F0A] text-white text-sm font-semibold"
              >
                Crear cuenta
              </button>
            </div>

            {/* Título */}
            <h2 className="text-3xl font-black text-[#3B1F0A] mb-1.5" style={{ fontFamily: "Georgia, serif" }}>
              Crea tu cuenta
            </h2>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Gratis para caficultores. En menos de 2 minutos.
            </p>

            {/* Tipo de usuario */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {[
                { val: "productor", ico: "👨‍🌾", nombre: "Caficultor", desc: "Vendo mi café" },
                { val: "comprador", ico: "🏪", nombre: "Comprador", desc: "Compro café" },
              ].map(({ val, ico, nombre, desc }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTipo(val)}
                  className={`py-3.5 px-3 rounded-2xl border-2 text-center transition-all ${
                    tipo === val
                      ? "border-[#C8814A] bg-[#C8814A]/5"
                      : "border-[#C8814A]/20 bg-white hover:border-[#C8814A]/50"
                  }`}
                >
                  <div className="text-3xl mb-1.5">{ico}</div>
                  <div className="text-sm font-bold text-[#3B1F0A]">{nombre}</div>
                  <div className="text-xs text-[#7B5C3E] mt-0.5">{desc}</div>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>

              {/* Nombre + Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Nombre</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tu nombre"
                      required
                      className="w-full pl-4 pr-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 transition-all"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Apellido</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tu apellido"
                      required
                      className="w-full pl-4 pr-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    required
                    className="w-full pl-4 pr-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 transition-all"
                  />
                </div>
              </div>

              {/* Celular */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
                  Celular <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+57 300 000 0000"
                    className="w-full pl-4 pr-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 transition-all"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
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
                {/* Barra de fortaleza */}
                {password.length > 0 && (
                  <>
                    <div className="flex gap-1.5 mt-2">
                      {[0, 1, 2, 3].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? segActive[strength - 1] : "bg-[#C8814A]/15"}`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-semibold mt-1.5 ${strengthColors[strength]}`}>
                      {strengthLabels[strength]}
                    </p>
                  </>
                )}
              </div>

              {/* Términos */}
              <label className="flex items-start gap-2.5 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={terminos}
                  onChange={e => setTerminos(e.target.checked)}
                  className="accent-[#C8814A] w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                />
                <span className="text-xs text-gray-500">
                  Acepto los{" "}
                  <a href="#" className="text-[#C8814A] font-semibold hover:underline">Términos de uso</a>
                  {" "}y la{" "}
                  <a href="#" className="text-[#C8814A] font-semibold hover:underline">Política de privacidad</a>
                  {" "}de CoffePrice
                </span>
              </label>
              {/* Botón */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl text-white text-sm font-bold mb-5 shadow-lg hover:scale-[1.02] transition-transform"
                style={{ background: "linear-gradient(135deg, #C8814A, #7A4020)" }}
              >
                Crear mi cuenta gratis
              </button>
            </form>

            <p className="text-center text-xs text-gray-400">
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-[#C8814A] font-semibold hover:underline"
              >
                Inicia sesión →
              </button>
            </p>
          </>
        )  : (
          /* Pantalla de éxito */
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-black text-[#3B1F0A] mb-3" style={{ fontFamily: "Georgia, serif" }}>
              ¡Bienvenido a CoffePrice!
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">
              Tu cuenta fue creada. Ya puedes ver los precios del café de tu zona y configurar tus alertas.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-3.5 rounded-xl text-white text-sm font-bold shadow-lg hover:scale-[1.02] transition-transform"
              style={{ background: "linear-gradient(135deg, #C8814A, #7A4020)" }}
            >
              ☕ Ir al dashboard →
            </button>
          </div> 
        )}

      </div>
    </div>
  );
}