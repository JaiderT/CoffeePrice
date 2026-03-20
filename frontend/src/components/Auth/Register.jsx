import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [tipo, setTipo] = useState("productor");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!terminos) {
      alert("Por favor acepta los términos de uso para continuar.");
      return;
    }
    if (password.length < 8) return;
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8081/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, apellido, email, password, celular, rol: tipo }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

      setSuccess(true);

    } catch (err) {
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
      <div className="w-full lg:w-[680px] bg-[#FAF7F2] flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 shrink-0 overflow-y-auto">

        {!success ? (
          <>
            {/* Logo visible solo en móvil */}
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div className="w-10 h-10 bg-[#C8814A] rounded-xl flex items-center justify-center text-xl shadow-lg">☕</div>
              <span className="text-3xl font-black text-[#3B1F0A]" style={{ fontFamily: "Georgia, serif" }}>CoffePrice</span>
            </div>

            {/* Tab switcher */}
            <div className="bg-white rounded-xl p-1 flex mb-9 shadow-sm">
              <button type="button" onClick={() => navigate("/login")}
                className="flex-1 py-2.5 rounded-lg text-gray-400 text-sm font-semibold hover:bg-[#C8814A]/5 transition-colors">
                Iniciar sesión
              </button>
              <button type="button"
                className="flex-1 py-2.5 rounded-lg bg-[#3B1F0A] text-white text-sm font-semibold">
                Crear cuenta
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#3B1F0A] mb-1.5" style={{ fontFamily: "Georgia, serif" }}>
              Crea tu cuenta
            </h2>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Gratis para caficultores. En menos de 2 minutos.
            </p>

            {/* Tipo de usuario */}
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

              {/* Nombre + Apellido */}
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

              {/* Email */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Correo electrónico</label>
                <input type="email" placeholder="tucorreo@ejemplo.com" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 transition-all"/>
              </div>

              {/* Celular */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
                  Celular <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input type="tel" placeholder="+57 300 000 0000" value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 transition-all"/>
              </div>

              {/* Contraseña */}
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

              {/* Términos */}
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

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-white text-sm font-bold mb-5 shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #3D1F0F, #7A4020)" }}>
                {loading ? "Creando cuenta..." : "Crear mi cuenta gratis"}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400">
              ¿Ya tienes cuenta?{" "}
              <button type="button" onClick={() => navigate("/login")}
                className="text-[#C8814A] font-semibold hover:underline">
                Inicia sesión →
              </button>
            </p>
          </>
        ) : (
          <div className="text-center py-8 px-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#3B1F0A] mb-3" style={{ fontFamily: "Georgia, serif" }}>
              ¡Bienvenido a CoffePrice!
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">
              Tu cuenta fue creada. Ya puedes ver los precios del café de tu zona y configurar tus alertas.
            </p>
            <button onClick={() => navigate("/login")}
              className="w-full py-3.5 rounded-xl text-white text-sm font-bold shadow-lg hover:scale-[1.02] transition-transform"
              style={{ background: "linear-gradient(135deg, #C8814A, #7A4020)" }}>
              ☕ Iniciar sesión 
            </button>
          </div>
        )}
      </div>
    </div>
  );
}