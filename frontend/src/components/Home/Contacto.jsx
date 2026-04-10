import { useState } from "react";
import Navbar from "../Layout/Navbar.jsx";
import Footer from "../Layout/Footer.jsx";
import { Sidebar } from "lucide-react";

export default function Contacto() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    asunto: "",
    mensaje: "",
  });

  const [errors, setErrors] = useState({});
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido.";
    if (!formData.correo.trim()) {
      newErrors.correo = "El correo es requerido.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      newErrors.correo = "Ingresa un correo válido.";
    }
    if (!formData.mensaje.trim()) newErrors.mensaje = "El mensaje es requerido.";
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setErrorEnvio("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setEnviando(true);
    setErrorEnvio("");

    try {
      const response = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Error del servidor");

      setEnviado(true);
      setTimeout(() => setEnviado(false), 3000);
      setFormData({ nombre: "", correo: "", asunto: "", mensaje: "" });
    } catch {
      setErrorEnvio("No se pudo enviar el mensaje. Intenta de nuevo más tarde.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="bg-[#F0E8D5] font-sans min-h-[70vh]">
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">

            {/* Encabezado */}
            <div className="text-center mb-12">
              <span className="inline-block bg-[#3d1f0d] text-[#f5dfc0] text-xs font-medium tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
                ☕ Soporte CoffePrice
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#2C1A0E] mb-4">
                Contáctanos
              </h2>
              <p className="text-[#7a5c3e] max-w-xl mx-auto leading-relaxed">
                ¿Tienes preguntas sobre precios del café, alertas o compradores? Nuestro equipo está listo para ayudarte.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">

              {/* Formulario */}
              <form
                onSubmit={handleSubmit}
                noValidate
                className="bg-[#fffdf8] border border-[#d4b896] rounded-2xl p-8 space-y-5"
              >
                <p className="text-[10px] font-semibold tracking-widest uppercase text-[#a0784e] mb-1">
                  Envíanos un mensaje
                </p>

                {enviado && (
                  <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
                    ✅ ¡Mensaje enviado con éxito! Te contactaremos pronto.
                  </div>
                )}

                {errorEnvio && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">
                    ❌ {errorEnvio}
                  </div>
                )}

                {/* Nombre */}
                <div>
                  <label htmlFor="nombre" className="block text-[#4a2f18] text-sm font-medium mb-1.5">
                    Nombre
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    className={`w-full bg-[#faf5ec] border rounded-xl px-4 py-3 text-sm text-[#2C1A0E] placeholder-[#b09070] focus:outline-none focus:ring-2 focus:ring-[#8b5e34] transition ${
                      errors.nombre ? "border-red-400" : "border-[#d4b896]"
                    }`}
                  />
                  {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                </div>

                {/* Correo */}
                <div>
                  <label htmlFor="correo" className="block text-[#4a2f18] text-sm font-medium mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    value={formData.correo}
                    onChange={handleChange}
                    placeholder="tucorreo@ejemplo.com"
                    className={`w-full bg-[#faf5ec] border rounded-xl px-4 py-3 text-sm text-[#2C1A0E] placeholder-[#b09070] focus:outline-none focus:ring-2 focus:ring-[#8b5e34] transition ${
                      errors.correo ? "border-red-400" : "border-[#d4b896]"
                    }`}
                  />
                  {errors.correo && <p className="text-red-500 text-xs mt-1">{errors.correo}</p>}
                </div>

                {/* Asunto */}
                <div>
                  <label htmlFor="asunto" className="block text-[#4a2f18] text-sm font-medium mb-1.5">
                    Asunto <span className="text-[#b09070] font-normal">(opcional)</span>
                  </label>
                  <input
                    id="asunto"
                    name="asunto"
                    type="text"
                    value={formData.asunto}
                    onChange={handleChange}
                    placeholder="¿En qué te podemos ayudar?"
                    className="w-full bg-[#faf5ec] border border-[#d4b896] rounded-xl px-4 py-3 text-sm text-[#2C1A0E] placeholder-[#b09070] focus:outline-none focus:ring-2 focus:ring-[#8b5e34] transition"
                  />
                </div>

                {/* Mensaje */}
                <div>
                  <label htmlFor="mensaje" className="block text-[#4a2f18] text-sm font-medium mb-1.5">
                    Mensaje
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    rows="4"
                    value={formData.mensaje}
                    onChange={handleChange}
                    placeholder="Escribe tu mensaje..."
                    className={`w-full bg-[#faf5ec] border rounded-xl px-4 py-3 text-sm text-[#2C1A0E] placeholder-[#b09070] focus:outline-none focus:ring-2 focus:ring-[#8b5e34] transition resize-none ${
                      errors.mensaje ? "border-red-400" : "border-[#d4b896]"
                    }`}
                  />
                  {errors.mensaje && <p className="text-red-500 text-xs mt-1">{errors.mensaje}</p>}
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full bg-[#3d1f0d] text-[#f5dfc0] font-semibold py-3 rounded-xl hover:bg-[#5a2e12] transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {enviando ? "Enviando..." : "Enviar mensaje"}
                </button>
              </form>

              {/* Panel de información */}
              <div className="flex flex-col gap-4">

                <div className="bg-[#fffdf8] border border-[#d4b896] rounded-2xl p-8">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-[#a0784e] mb-5">
                    Información de contacto
                  </p>
                  <div className="flex flex-col gap-3">

                    <div className="flex items-center gap-3 bg-[#faf5ec] border border-[#d4b896] rounded-xl p-4">
                      <div className="w-9 h-9 rounded-full bg-[#f0d9bc] flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-map-marker-alt text-[#6b3c1e] text-sm"></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#a0784e]">Ubicación</p>
                        <p className="text-sm text-[#2C1A0E]">Pital · Huila, Colombia</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-[#faf5ec] border border-[#d4b896] rounded-xl p-4">
                      <div className="w-9 h-9 rounded-full bg-[#f0d9bc] flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-phone text-[#6b3c1e] text-sm"></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#a0784e]">Teléfono / WhatsApp</p>
                        <p className="text-sm text-[#2C1A0E]">+57 315 279 8859</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-[#faf5ec] border border-[#d4b896] rounded-xl p-4">
                      <div className="w-9 h-9 rounded-full bg-[#f0d9bc] flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-envelope text-[#6b3c1e] text-sm"></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#a0784e]">Correo electrónico</p>
                        <p className="text-sm text-[#2C1A0E]">support.coffeprice@gmail.com</p>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="bg-[#fffdf8] border border-[#d4b896] rounded-2xl px-8 py-6">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-[#a0784e] mb-4">
                    Horario de atención
                  </p>
                  <div className="flex justify-between text-sm py-2 border-b border-[#e8d9c4]">
                    <span className="text-[#7a5c3e]">Lunes – Viernes</span>
                    <span className="text-[#2C1A0E] font-medium">8:00 am – 5:00 pm</span>
                  </div>
                  <div className="flex justify-between text-sm py-2">
                    <span className="text-[#7a5c3e]">Sábados</span>
                    <span className="text-[#2C1A0E] font-medium">9:00 am – 1:00 pm</span>
                  </div>
                </div>

                <div className="bg-[#fffdf8] border border-[#d4b896] rounded-2xl px-8 py-6">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-[#a0784e] mb-4">
                    Síguenos
                  </p>
                  <div className="flex gap-3">
                    <a
                      href="https://www.facebook.com/profile.php?id=61575364127180"
                      aria-label="Facebook"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-[#faf5ec] border border-[#d4b896] rounded-xl text-sm text-[#4a2f18] font-medium hover:bg-[#f0d9bc] transition"
                    >
                      <i className="fa-brands fa-facebook text-blue-600"></i>
                      Facebook
                    </a>
                    <a
                      href="#"
                      aria-label="Instagram"
                      className="flex items-center gap-2 px-4 py-2 bg-[#faf5ec] border border-[#d4b896] rounded-xl text-sm text-[#4a2f18] font-medium hover:bg-[#f0d9bc] transition"
                    >
                      <i className="fab fa-instagram text-pink-600"></i>
                      Instagram
                    </a>
                    <a
                      href="https://wa.me/573152798859"
                      aria-label="WhatsApp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-[#faf5ec] border border-[#d4b896] rounded-xl text-sm text-[#4a2f18] font-medium hover:bg-[#f0d9bc] transition"
                    >
                      <i className="fab fa-whatsapp text-green-600"></i>
                      WhatsApp
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}