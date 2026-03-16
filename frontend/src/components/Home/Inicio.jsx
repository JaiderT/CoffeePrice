import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../Layout/Navbar';
import Footer from '../Layout/Footer';

const datosGrafica = [
  { mes: 'Feb', precio: 1700000 },
  { mes: 'Mar', precio: 1850000 },
  { mes: 'Hoy', precio: 1950000 },
];

function Inicio() {
  return (
    <>
       <Navbar />
    <div className="min-h-screen bg-[#F5ECD7]">

      {/* Hero Section */}
      <div className="w-full bg-[#3D1F0F] py-20">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">

          {/* Texto izquierda */}
          <div className="max-w-lg">
            <span className="bg-[#6B3A2A] text-[#C8A96E] text-xs px-3 py-1 rounded-full">
              ☕ Para caficultores colombianos
            </span>
            <h1 className="text-white text-5xl font-bold mt-6 leading-tight">
              Conoce el valor <br />
              <span className="text-[#C8A96E] italic">real del café</span>
            </h1>
            <p className="text-gray-300 mt-4 text-sm leading-relaxed">
              Consulta los precios de todos los compradores de tu municipio en tiempo real. Sin recorrer el pueblo, sin intermediarios. Vende siempre al mejor precio.
            </p>
            <div className="flex gap-4 mt-8">
              <Link to="/precios" className="bg-[#C8A96E] text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#B8994E] transition-colors">
                ☕ Ver precios ahora
              </Link>
              <Link to="#" className="border border-white text-white px-6 py-3 rounded-full text-sm hover:bg-white hover:text-[#3D1F0F] transition-colors">
                ▶ Cómo funciona
              </Link>
            </div>
            <div className="flex gap-10 mt-12">
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
          {/* Tarjeta precio derecha */}
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl relative">
            <div className="absolute -top-4 right-4 bg-white rounded-xl px-4 py-2 shadow-md flex items-center gap-2">
              <span className="text-red-500 text-xs">📍</span>
              <div>
                <p className="text-xs text-gray-500">1.2 km de ti</p>
                <p className="text-sm font-bold text-[#2C1A0E]">Coop. El Huila</p>
                <p className="text-xs text-green-500">▲ Mejor precio hoy</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">PRECIO PROMEDIO · PITALITO</p>
            <h2 className="text-4xl font-bold text-[#2C1A0E] mt-1">1.950.000</h2>
            <p className="text-sm text-gray-500">COP por carga</p>
            <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full mt-2 inline-block">
              ▲ +2.1% vs ayer
            </span>
            <div className="mt-4">
              <p className="text-xs text-gray-400 font-semibold mb-3">MEJORES PRECIOS HOY</p>
              {[
                { nombre: 'Cooperativa El Huila', precio: '2.060.000', medal: '🥇' },
                { nombre: 'Café San Agustín', precio: '2.010.000', medal: '🥈' },
                { nombre: 'Coacafé Ltda.', precio: '1.980.000', medal: '🥉' },
                { nombre: 'Punto de Ingreso', precio: '1.960.000', medal: '🥉' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span>{item.medal}</span>
                    <span className="text-sm text-[#2C1A0E]">{item.nombre}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#2C1A0E]">{item.precio}</span>
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
      <div className="w-full bg-[#3D1F0F] py-16">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="max-w-md">
            <p className="text-[#C8A96E] text-xs font-semibold uppercase">Precio en tiempo real</p>
            <h2 className="text-white text-4xl font-bold mt-3 leading-tight">
              El precio de hoy, <br /> en tu bolsillo
            </h2>
            <p className="text-gray-400 text-sm mt-4">
              Actualizado constantemente por los propios compradores. Sin demoras, sin intermediarios.
            </p>
            <p className="text-white text-5xl font-bold mt-6">
              1.950.000 <span className="text-lg font-normal text-gray-400">COP/carga</span>
            </p>
            <p className="text-gray-400 text-sm mt-1">Promedio Pitalito, Huila · Hoy</p>
            <Link to="/precios" className="bg-[#C8A96E] text-white px-6 py-3 rounded-full text-sm font-semibold mt-6 inline-block hover:bg-[#B8994E] transition-colors">
              Ver todos los precios →
            </Link>
          </div>
          <div className="w-96 h-48">
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

      {/* Cómo funciona */}
      <div className="w-full bg-[#F5ECD7] py-16">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p className="text-[#C8A96E] text-xs font-semibold uppercase">Simple y rápido</p>
          <h2 className="text-[#2C1A0E] text-4xl font-bold mt-3">¿Cómo funciona CoffePrice?</h2>
          <p className="text-gray-500 text-sm mt-3 max-w-lg mx-auto">
            En 3 pasos ya sabes a quién venderle tu café para recibir el mejor precio del día.
          </p>
          <div className="grid grid-cols-4 gap-6 mt-10">
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

      {/* Testimonios */}
      <div className="w-full bg-[#F5ECD7] py-16">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p className="text-[#C8A96E] text-xs font-semibold uppercase">Lo que dicen los caficultores</p>
          <h2 className="text-[#2C1A0E] text-4xl font-bold mt-3">Voces del campo</h2>
          <p className="text-gray-500 text-sm mt-3">Caficultores del Huila que ya están tomando mejores decisiones con CoffePrice.</p>
          <div className="grid grid-cols-3 gap-6 mt-10">
            {[
              { stars: '★★★★★', texto: '"Antes me tocaba salir desde las 5am a recorrer 3 compras antes de decidir a quién le vendía. Ahora lo miro desde la casa y ya sé a dónde ir."', nombre: 'Jaider Muñoz', lugar: 'Caficultor · Pitalito, Huila' },
              { stars: '★★★★★', texto: '"La alerta de precio es lo mejor. Me llegó un mensaje que el precio subió y pude vender ese mismo día. Gané como $120.000 más que la semana anterior."', nombre: 'María Ospina', lugar: 'Caficultora · Acevedo, Huila' },
              { stars: '★★★★☆', texto: '"Mis hijos me instalaron esto en el celular y es muy fácil de usar. El mapa me muestra exactamente a dónde ir. Ya no necesito llamar a nadie para preguntar precios."', nombre: 'Don Ernesto Vargas', lugar: 'Caficultor · La Argentina, Huila' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-b-4 hover:border-[#C8A96E] cursor-pointer">
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
      <div className="w-full bg-[#3D1F0F] py-16">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="text-white text-5xl font-bold">¿Listo para vender <br /> al mejor precio?</h2>
          <p className="text-gray-400 text-sm mt-4">Únete a los caficultores del Huila que ya consultan CoffePrice antes de vender.</p>
          <div className="flex justify-center gap-4 mt-8">
            <Link to="/registro" className="bg-[#C8A96E] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#B8994E] transition-colors">
              ☕ Crear cuenta gratis
            </Link>
            <Link to="/precios" className="border border-white text-white px-8 py-3 rounded-full hover:bg-white hover:text-[#3D1F0F] transition-colors">
              Ver precios sin registrarse →
            </Link>
          </div>
          <p className="text-gray-500 text-xs mt-6">✓ Gratis para caficultores · ✓ Sin tarjeta de crédito · ✓ Cancela cuando quieras</p>
        </div>
      </div>
    </div>
    <Footer />
    </>
  )
}
export default Inicio
