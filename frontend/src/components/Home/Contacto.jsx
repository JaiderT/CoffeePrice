import { useState } from "react";
import Navbar from "../Layout/Navbar.jsx";
import Footer from "../Layout/Footer.jsx";

export default function Contacto() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    mensaje: "",
  });

  const [errors, setErrors] = useState({});
  const [enviado, setEnviado] = useState(false);

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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    console.log("Formulario enviado:", formData);
    setEnviado(true);
    setFormData({ nombre: "", correo: "", mensaje: "" });
  };

  return (
    <>
      <Navbar />

      <main className="bg-[#F5ECD7] font-sans min-h-[70vh]">
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">

            {/* Título */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#2C1A0E] mb-4">
                Contáctanos
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                ¿Tienes preguntas sobre precios del café, alertas o compradores? Nuestro equipo está listo para ayudarte.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-start">

              {/* Formulario */}
              <form
                onSubmit={handleSubmit}
                noValidate
                className="bg-white shadow-lg rounded-2xl p-8 space-y-5"
              >
                {enviado && (
                  <div className="bg-green-100 text-green-700 rounded-lg px-4 py-3 text-sm font-medium">
                    ✅ ¡Mensaje enviado con éxito! Te contactaremos pronto.
                  </div>
                )}

                {/* Nombre */}
                <div>
                  <label
                    htmlFor="nombre"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Nombre
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A96E] ${
                      errors.nombre ? "border-red-400" : "border-gray-300"
                    }`}
                  />
                  {errors.nombre && (
                    <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
                  )}
                </div>

                {/* Correo */}
                <div>
                  <label
                    htmlFor="correo"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    value={formData.correo}
                    onChange={handleChange}
                    placeholder="tucorreo@ejemplo.com"
                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A96E] ${
                      errors.correo ? "border-red-400" : "border-gray-300"
                    }`}
                  />
                  {errors.correo && (
                    <p className="text-red-500 text-sm mt-1">{errors.correo}</p>
                  )}
                </div>

                {/* Mensaje */}
                <div>
                  <label
                    htmlFor="mensaje"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Mensaje
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    rows="4"
                    value={formData.mensaje}
                    onChange={handleChange}
                    placeholder="Escribe tu mensaje..."
                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A96E] ${
                      errors.mensaje ? "border-red-400" : "border-gray-300"
                    }`}
                  />
                  {errors.mensaje && (
                    <p className="text-red-500 text-sm mt-1">{errors.mensaje}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#2C1A0E] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition"
                >
                  Enviar mensaje
                </button>
              </form>

              {/* Información de contacto */}
              <div className="rounded-2xl p-8 space-y-6">

                <h3 className="text-xl font-semibold text-[#2C1A0E] mb-2">
                  Información de contacto
                </h3>

                <div className="flex items-center gap-3">
                  <i className="fas fa-map-marker-alt text-[#C8A96E] text-xl"></i>
                  <p className="text-gray-700">
                    Pital - Huila, Colombia
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <i className="fas fa-phone text-[#C8A96E] text-xl"></i>
                  <p className="text-gray-700">+57 315 279 8859</p>
                </div>

                <div className="flex items-center gap-3">
                  <i className="fas fa-envelope text-[#C8A96E] text-xl"></i>
                  <p className="text-gray-700">support.coffeprice@gmail.com</p>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    Síguenos
                  </h4>
                  <div className="flex gap-4 text-2xl text-[#2C1A0E]">
                    <a href="https://www.facebook.com/profile.php?id=61575364127180" aria-label="Facebook" className="hover:text-blue-600 transition">
                      <i className="fa-brands fa-facebook"></i>
                    </a>
                    <a href="#" aria-label="Instagram" className="hover:text-pink-600 transition">
                      <i className="fab fa-instagram"></i>
                    </a>
                    <a href="https://wa.me/573152798859" aria-label="WhatsApp" className="hover:text-green-600 transition">
                      <i className="fab fa-whatsapp"></i>
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