import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContex.jsx';
import axios from 'axios';
import Navbar from '../Layout/Navbar';
import Footer from '../Layout/Footer';

function Inicio() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [precios, setPrecios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarComoFunciona, setMostrarComoFunciona] = useState(false);
  const comoFuncionaRef = useRef(null);
  const { usuario } = useAuth();

const rutaPanel = usuario
  ? usuario.rol === 'admin'
    ? '/admin/perfil'
    : usuario.rol === 'comprador'
    ? '/comprador/dashboard'
    : '/perfil'
  : '/register';


  useEffect(() => {
    const obtenerPrecios = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/precios`);
        setPrecios(data);
      } catch (error) {
        console.error('Error al obtener precios:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerPrecios();
  }, [API_URL]);

  const handleComoFunciona = () => {
    setMostrarComoFunciona(true);
    setTimeout(() => {
      comoFuncionaRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const medalles = ['🥇', '🥈', '🥉', '🥉'];

  const datosGrafica = precios.slice(0, 7).map((p, i) => ({
    mes: p.comprador?.nombreempresa?.slice(0, 6) || `P${i + 1}`,
    precio: p.preciocarga
  }));

  return (
    <div className="min-h-screen bg-[#F5ECD7]">
      <Navbar />
      {/* Hero Section */}
      <div className="w-full bg-[#3D1F0F] py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row items-center justify-between gap-10">
          {/* Texto izquierda */}
          <div className="w-full lg:max-w-lg text-center lg:text-left">
            <span className="bg-[#6B3A2A] text-[#C8A96E] text-xs px-3 py-1 rounded-full">
              ☕ Para caficultores colombianos
            </span>
            <h1 className="text-white text-4xl md:text-5xl font-bold mt-6 leading-tight">
              Conoce el valor <br />
              <span className="text-[#C8A96E] italic">real del café</span>
            </h1>
            <p className="text-gray-300 mt-4 text-sm leading-relaxed">
              Consulta los precios de todos los compradores de tu municipio en tiempo real. Sin recorrer el pueblo, sin intermediarios. Vende siempre al mejor precio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center lg:justify-start">
              <Link
                to="/precios"
                className="bg-[#C8A96E] text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#B8994E] transition-colors text-center"
              >
                ☕ Ver precios ahora
              </Link>

              {usuario ? (
                <Link
                  to={rutaPanel}
                  className="border border-white text-white px-6 py-3 rounded-full text-sm hover:bg-white hover:text-[#3D1F0F] transition-colors text-center"
                >
                  Ir a mi panel
                </Link>
              ) : (
                <button
                  onClick={handleComoFunciona}
                  className="border border-white text-white px-6 py-3 rounded-full text-sm hover:bg-white hover:text-[#3D1F0F] transition-colors text-center"
                >
                  ▶ Cómo funciona
                </button>
              )}
            </div>

            <div className="flex justify-center lg:justify-start gap-8 mt-10">
              <div>
                <p className="text-white text-2xl font-bold">+240</p>
                <p className="text-gray-400 text-xs">Compradores registrados</p>
              </div>
              <div>
                <p className="text-white text-2xl font-bold">12</p>
                <p className="text-gray-400 text-xs">Municipios activos</p>
              </div>
              <div>
                <p className="text-white text-2xl font-bold">Gratis</p>
                <p className="text-gray-400 text-xs">Para caficultores</p>
              </div>
            </div>
          </div>
          {/* Tarjeta precio */}
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl relative mx-auto lg:mx-0">
            <div className="absolute -top-4 right-4 bg-white rounded-xl px-4 py-2 shadow-md flex items-center gap-2">
              <span className="text-red-500 text-xs">📍</span>
              <div>
                <p className="text-xs text-gray-500">1.2 km de ti</p>
                <p className="text-sm font-bold text-[#2C1A0E]">Coop. El Huila</p>
                <p className="text-xs text-green-500">▲ Mejor precio hoy</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">PRECIO PROMEDIO · PITALITO</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C1A0E] mt-1">
              {precios[0]?.preciocarga?.toLocaleString() || '1.950.000'}
            </h2>
            <p className="text-sm text-gray-500">COP por carga</p>
            <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full mt-2 inline-block">
              ▲ +2.1% vs ayer
            </span>
            <div className="mt-4">
              <p className="text-xs text-gray-400 font-semibold mb-3">MEJORES PRECIOS HOY</p>
              {cargando ? (
                <p className="text-gray-400 text-sm text-center py-4">Cargando precios...</p>
              ) : precios.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span>{medalles[i]}</span>
                    <span className="text-sm text-[#2C1A0E]">{item.comprador?.nombreempresa}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#2C1A0E]">
                    {item.preciocarga?.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-[#FFF8E7] rounded-xl p-3 mt-4 flex items-start gap-2">
              <span>🔔</span>
              <div>
                <p className="text-xs font-bold text-[#2C1A0E]">Tu alerta</p>
                <p className="text-sm font-bold text-[#2C1A0E]">¡Precio superó 2M!</p>
                <p className="text-xs text-[#C8A96E]">Toca para ver dónde →</p>
              </div>
            </div>
          </div>

        </div>
      </div>
      {/* Precio en tiempo real */}
      <div className="w-full bg-[#3D1F0F] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="w-full lg:max-w-md text-center lg:text-left">
            <p className="text-[#C8A96E] text-xs font-semibold uppercase">Precio en tiempo real</p>
            <h2 className="text-white text-3xl md:text-4xl font-bold mt-3 leading-tight">
              El precio de hoy, <br /> en tu bolsillo
            </h2>
            <p className="text-gray-400 text-sm mt-4">
              Actualizado constantemente por los propios compradores. Sin demoras, sin intermediarios.
            </p>
            <p className="text-white text-4xl md:text-5xl font-bold mt-6">
              {precios[0]?.preciocarga?.toLocaleString() || '1.950.000'}
              <span className="text-lg font-normal text-gray-400"> COP/carga</span>
            </p>
            <p className="text-gray-400 text-sm mt-1">Promedio Pitalito, Huila · Hoy</p>
            <Link to="/precios" className="bg-[#C8A96E] text-white px-6 py-3 rounded-full text-sm font-semibold mt-6 inline-block hover:bg-[#B8994E] transition-colors">
              Ver todos los precios →
            </Link>
          </div>
          <div className="w-full lg:w-96 h-48 min-h-48[192px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosGrafica}>
                <Line type="monotone" dataKey="precio" stroke="#C8A96E" strokeWidth={3} dot={false} />
                <XAxis dataKey="mes" stroke="#ffffff50" tick={{ fill: '#ffffff80', fontSize: 12 }} />
                <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Precio']} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Sección Cómo funciona - oculta hasta que se presione el botón */}
      {mostrarComoFunciona && (
        <div ref={comoFuncionaRef} className="w-full bg-[#F5ECD7] py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">

            {/* Botón cerrar */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setMostrarComoFunciona(false)}
                className="text-[#6B3A2A] border border-[#6B3A2A] px-4 py-2 rounded-full text-xs hover:bg-[#6B3A2A] hover:text-white transition-colors">
                ✕ Ocultar
              </button>
            </div>
            <p className="text-[#C8A96E] text-xs font-semibold uppercase">Simple y rápido</p>
            <h2 className="text-[#2C1A0E] text-3xl md:text-4xl font-bold mt-3">¿Cómo funciona CoffePrice?</h2>
            <p className="text-gray-500 text-sm mt-3 max-w-lg mx-auto">
              En 3 pasos ya sabes a quién venderle tu café para recibir el mejor precio del día.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
              {[
                { icon: '📍', title: 'Activa tu ubicación', desc: 'Dinos en qué municipio estás. No necesitas crear cuenta para ver los precios de tu zona.' },
                { icon: '💰', title: 'Compara precios', desc: 'Ve todos los compradores del municipio ordenados por precio, distancia o calificación.' },
                { icon: '🗺️', title: 'Encuentra el punto', desc: 'Toca el mapa para ver exactamente dónde queda cada comprador y cómo llegar desde tu finca.' },
                { icon: '🔔', title: 'Activa alertas', desc: 'Regístrate gratis y te avisamos cuando el precio supere el valor que tú defines.' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-b-4 hover:border-[#C8A96E] cursor-pointer">
                  <div className="bg-[#F5ECD7] w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-[#2C1A0E] font-bold text-sm">{item.title}</h3>
                  <p className="text-gray-500 text-xs mt-2 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Testimonios */}
      <div className="w-full bg-[#F5ECD7] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <p className="text-[#C8A96E] text-xs font-semibold uppercase">Lo que dicen los caficultores</p>
          <h2 className="text-[#2C1A0E] text-3xl md:text-4xl font-bold mt-3">Voces del campo</h2>
          <p className="text-gray-500 text-sm mt-3">Caficultores del Huila que ya están tomando mejores decisiones con CoffePrice.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {[
              { stars: '★★★★★', texto: '"Antes me tocaba salir desde las 5am a recorrer 3 compras antes de decidir a quién le vendía. Ahora lo miro desde la casa y ya sé a dónde ir."', nombre: 'Jaider Muñoz', lugar: 'Caficultor · Pitalito, Huila' },
              { stars: '★★★★★', texto: '"La alerta de precio es lo mejor. Me llegó un mensaje que el precio subió y pude vender ese mismo día. Gané como $120.000 más que la semana anterior."', nombre: 'María Ospina', lugar: 'Caficultora · Acevedo, Huila' },
              { stars: '★★★★☆', texto: '"Mis hijos me instalaron esto en el celular y es muy fácil de usar. El mapa me muestra exactamente a dónde ir. Ya no necesito llamar a nadie para preguntar precios."', nombre: 'Don Ernesto Vargas', lugar: 'Caficultor · La Argentina, Huila' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm text-left">
                <p className="text-[#C8A96E] text-lg">{item.stars}</p>
                <p className="text-gray-600 text-sm mt-3 italic leading-relaxed">{item.texto}</p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-10 h-10 bg-[#C8A96E] rounded-full flex items-center justify-center text-xl">👤</div>
                  <div>
                    <p className="text-[#2C1A0E] font-bold text-sm">{item.nombre}</p>
                    <p className="text-gray-400 text-xs">{item.lugar}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* CTA Final */}
      <div className="w-full bg-[#3D1F0F] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-white text-4xl md:text-5xl font-bold">¿Listo para vender <br /> al mejor precio?</h2>
          <p className="text-gray-400 text-sm mt-4">Únete a los caficultores del Huila que ya consultan CoffePrice antes de vender.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            {usuario ? (
              <Link
                to={rutaPanel}
                className="bg-[#C8A96E] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#B8994E] transition-colors"
              >
                Ir a mi panel
              </Link>
            ) : (
              <Link
                to="/register"
                className="bg-[#C8A96E] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#B8994E] transition-colors"
              >
                ☕ Crear cuenta gratis
              </Link>
            )}

            <Link
              to="/precios"
              className="border border-white text-white px-8 py-3 rounded-full hover:bg-white hover:text-[#3D1F0F] transition-colors"
            >
              Ver precios sin registrarse →
            </Link>
          </div>

          <p className="text-gray-500 text-xs mt-6">✓ Gratis para caficultores · ✓ Sin tarjeta de crédito · ✓ Cancela cuando quieras</p>
        </div>
      </div>
    </div>
  );
}

export default Inicio;
