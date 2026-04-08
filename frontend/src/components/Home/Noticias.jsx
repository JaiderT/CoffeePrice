import { useState } from 'react';
import Navbar from '../Layout/Navbar';
import Footer from '../Layout/Footer';

const noticias = [
  {
    id: 1,
    categoria: 'Precios del café',
    emoji: '📈',
    titulo: 'El precio interno del café supera los $2.000.000 por carga en varios municipios del Huila',
    descripcion: 'Compradores de Pitalito, Acevedo y La Argentina registran los precios más altos del año, impulsados por la fuerte demanda externa y la reducción de inventarios.',
    fuente: 'Redacción CoffePrice',
    tiempo: 'Hace 2 horas',
    destacada: true,
    url: 'https://federaciondecafeteros.org/wp/',
  },
  {
    id: 2,
    categoria: 'Clima y cosechas',
    imagen: 'https://lavozdelaregion.co/wp-content/uploads/2021/11/Invierno-fenomeno-de-la-nina.jpeg',
    titulo: 'Fenómeno La Niña podría afectar la cosecha principal en el sur del Huila',
    descripcion: 'El IDEAM advierte lluvias por encima del promedio entre octubre y diciembre.',
    fuente: 'Cenicafé · IDEAM',
    tiempo: 'Ayer',
    url: 'https://www.cenicafe.org/',
  },
  {
    id: 3,
    categoria: 'Mercado internacional',
    imagen: 'https://caldas.federaciondecafeteros.org/app/uploads/sites/11/2021/04/CAD-621-2.jpg',
    titulo: 'Bolsa de Nueva York: el café arábico cierra semana al alza por tercer mes consecutivo',
    descripcion: 'El contrato "C" subió 3.2% impulsado por bajos inventarios en Brasil y Vietnam.',
    fuente: 'Reuters · Bloomberg',
    tiempo: 'Hace 3 días',
    url: 'https://es.investing.com/commodities/us-coffee-c',
  },
  {
    id: 4,
    categoria: 'Noticias del sector',
    imagen: 'https://federaciondecafeteros.org/app/uploads/2019/11/home-noticis-1.jpg',
    titulo: 'Federación Nacional de Cafeteros anuncia subsidio para renovación de cafetales en el Huila',
    descripcion: 'El programa beneficiará a más de 4.000 familias cafeteras con hasta $800.000 por hectárea renovada.',
    fuente: 'FNC Colombia',
    tiempo: 'Esta semana',
    url: 'https://federaciondecafeteros.org/wp/noticias/',
  },
  {
    id: 5,
    categoria: 'Precios del café',
    imagen: 'https://cafecostal.com/wp-content/uploads/2025/06/precios-del-cafe.webp',
    titulo: '¿Por qué el café colombiano cotiza por encima del promedio mundial este trimestre?',
    descripcion: 'Expertos explican el diferencial positivo del café suave colombiano frente a otros orígenes.',
    fuente: 'Portafolio',
    tiempo: 'Esta semana',
    url: 'https://www.larepublica.co/indicadores-economicos/commodities/cafe',
  },
];

const categoriaBadgeColors = {
  'Precios del café': 'bg-[#FFF3E0] text-[#C8A96E]',
  'Clima y cosechas': 'bg-blue-50 text-blue-600',
  'Mercado internacional': 'bg-amber-50 text-amber-700',
  'Noticias del sector': 'bg-green-50 text-green-700',
};

function ModalAlertas({ onClose, alertasActivas, setAlertasActivas }) {
  const [paso, setPaso] = useState('seleccion');
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState(
    alertasActivas.categorias || []
  );

  const categorias = [
    { id: 'Precios del café',      imagen: 'https://cafecostal.com/wp-content/uploads/2025/06/precios-del-cafe.webp', desc: 'Cuando el precio suba o baje' },
    { id: 'Mercado internacional', imagen: 'https://caldas.federaciondecafeteros.org/app/uploads/sites/11/2021/04/CAD-621-2.jpg', desc: 'Bolsa de NY y mercados globales' },
    { id: 'Clima y cosechas',      imagen: 'https://lavozdelaregion.co/wp-content/uploads/2021/11/Invierno-fenomeno-de-la-nina.jpeg', desc: 'Alertas de clima y cosechas' },
    { id: 'Noticias del sector',   imagen: 'https://federaciondecafeteros.org/app/uploads/2019/11/home-noticis-1.jpg', desc: 'FNC, subsidios y política cafetera' },
  ];

  const toggleCategoria = (id) => {
    setCategoriasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const activarNotificaciones = async () => {
    if (!('Notificacion' in window)) {
      alert('Tu navegador no soporta notificaciones push.');
      return;
    }
    const permiso = await Notification.requestPermission();
    if (permiso === 'granted') {
      const config = { activas: true, categorias: categoriasSeleccionadas };
      localStorage.setItem('coffeprice_alertas', JSON.stringify(config));
      setAlertasActivas(config);
      new Notification('¡Alertas activadas! ☕', {
        body: categoriasSeleccionadas.length > 0
          ? `Recibirás noticias de: ${categoriasSeleccionadas.join(', ')}`
          : 'Recibirás todas las noticias del café',
        icon: '/favicon.ico',
      });
      setPaso('exito');
    } else {
      setPaso('denegado');
    }
  };

  const desactivar = () => {
    localStorage.removeItem('coffeprice_alertas');
    setAlertasActivas({ activas: false, categorias: [] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#3D1F0F] px-6 pt-6 pb-8">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-xl leading-none">✕</button>
          <div className="text-4xl mb-3">🔔</div>
          <h3 className="text-white text-xl font-bold">Alertas de noticias</h3>
          <p className="text-gray-400 text-sm mt-1">Entérate al instante cuando haya novedades del café</p>
        </div>
        <div className="px-6 py-6">
          {paso === 'seleccion' && (
            <>
              <p className="text-[#2C1A0E] text-sm font-semibold mb-4">¿Sobre qué quieres recibir alertas?</p>
              <div className="space-y-2 mb-5">
                {categorias.map((cat) => {
                  const activa = categoriasSeleccionadas.includes(cat.id);
                  return (
                    <button key={cat.id} onClick={() => toggleCategoria(cat.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${activa ? 'border-[#C8A96E] bg-[#FFF8EF]' : 'border-gray-100 bg-gray-50 hover:border-[#D4B898]'}`}>
                      <span className="text-xl">{cat.emoji}</span>
                      <div className="flex-1">
                        <p className={`text-xs font-bold ${activa ? 'text-[#3D1F0F]' : 'text-gray-600'}`}>{cat.id}</p>
                        <p className="text-xs text-gray-400">{cat.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${activa ? 'bg-[#C8A96E] border-[#C8A96E]' : 'border-gray-300'}`}>
                        {activa && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-gray-400 text-xs mb-4 text-center">
                {categoriasSeleccionadas.length === 0 ? 'Sin selección recibirás todas las alertas' : `${categoriasSeleccionadas.length} categoría${categoriasSeleccionadas.length > 1 ? 's' : ''} seleccionada${categoriasSeleccionadas.length > 1 ? 's' : ''}`}
              </p>
              <button onClick={activarNotificaciones} className="w-full bg-[#3D1F0F] text-white py-3 rounded-full font-semibold text-sm hover:bg-[#5a2e18] transition-colors">
                🔔 Activar notificaciones
              </button>
              {alertasActivas.activas && (
                <button onClick={desactivar} className="w-full mt-2 text-red-400 text-xs py-2 hover:text-red-600 transition-colors">
                  Desactivar alertas
                </button>
              )}
            </>
          )}
          {paso === 'exito' && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <h4 className="text-[#2C1A0E] font-bold text-lg mb-2">¡Alertas activadas!</h4>
              <p className="text-gray-500 text-sm mb-3">Te avisaremos cuando haya noticias de:</p>
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {(categoriasSeleccionadas.length > 0 ? categoriasSeleccionadas : categorias.map((c) => c.id)).map((cat) => (
                  <span key={cat} className="bg-[#FFF3E0] text-[#C8A96E] text-xs font-semibold px-3 py-1 rounded-full">{cat}</span>
                ))}
              </div>
              <button onClick={onClose} className="w-full bg-[#C8A96E] text-white py-3 rounded-full font-semibold text-sm hover:bg-[#B8994E] transition-colors">
                Perfecto, cerrar
              </button>
            </div>
          )}
          {paso === 'denegado' && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🚫</div>
              <h4 className="text-[#2C1A0E] font-bold text-lg mb-2">Permiso denegado</h4>
              <p className="text-gray-500 text-sm mb-4">Bloqueaste las notificaciones en tu navegador. Sigue estos pasos para activarlas:</p>
              <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
                <ol className="text-xs text-gray-500 space-y-1.5 list-decimal list-inside">
                  <li>Haz clic en el candado 🔒 en la barra de direcciones</li>
                  <li>Busca "Notificaciones" y cámbialo a "Permitir"</li>
                  <li>Recarga la página e intenta de nuevo</li>
                </ol>
              </div>
              <button onClick={onClose} className="w-full bg-[#3D1F0F] text-white py-3 rounded-full font-semibold text-sm hover:bg-[#5a2e18] transition-colors">
                Entendido
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Noticias() {
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [alertasActivas, setAlertasActivas] = useState(() => {
    try {
      const guardado = localStorage.getItem('coffeprice_alertas');
      return guardado ? JSON.parse(guardado) : { activas: false, categorias: [] };
    } catch {
      return { activas: false, categorias: [] };
    }
  });

  const noticiasFiltradas =
    categoriaActiva === 'Todas'
      ? noticias
      : noticias.filter((n) => n.categoria === categoriaActiva);

  const destacada = noticiasFiltradas.find((n) => n.destacada);
  const secundarias = noticiasFiltradas.filter((n) => !n.destacada);

  return (
    // ✅ FIX: bg-[#2C1A0E] en el div raíz para que el espacio sobrante
    // tenga el mismo color oscuro del footer y no se vea blanco
    <div className="bg-[#2C1A0E]">
      <Navbar />
      {/* ✅ FIX: el contenido crema ocupa al menos toda la pantalla */}
      <div className="w-full bg-[#F5ECD7] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-7">

          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-[#C8A96E] text-xs font-semibold uppercase tracking-widest">Al día con el campo</p>
              <h2 className="text-[#2C1A0E] text-3xl md:text-4xl font-bold mt-2">Noticias del café</h2>
              <p className="text-gray-500 text-sm mt-2">Lo más relevante del sector cafetero colombiano e internacional.</p>
            </div>
          </div>

          {/* Categorías */}
          <div className="flex gap-2 flex-wrap mb-8">
            {['Todas', 'Precios del café', 'Mercado internacional', 'Clima y cosechas', 'Noticias del sector'].map((cat, i) => (
              <button
                key={i}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  categoriaActiva === cat
                    ? 'bg-[#3D1F0F] text-white'
                    : 'bg-white text-[#3D1F0F] border border-[#D4B898] hover:bg-[#3D1F0F] hover:text-white'
                }`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Sin resultados */}
          {noticiasFiltradas.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">
              No hay noticias en esta categoría por el momento.
            </div>
          )}

          {/* Grid noticias */}
          {noticiasFiltradas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destacada && (
                <a
                  href={destacada.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${secundarias.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} bg-[#3D1F0F] rounded-2xl overflow-hidden shadow-md group cursor-pointer hover:-translate-y-1 transition-transform duration-300`}
                >
                  <div className="p-6 md:p-8 flex flex-col justify-between h-full min-h-[260px]">
                    <div>
                      <span className="bg-[#C8A96E] text-[#3D1F0F] text-xs font-bold px-3 py-1 rounded-full">
                        📈 {destacada.categoria}
                      </span>
                      <h3 className="text-white text-xl md:text-2xl font-bold mt-4 leading-snug group-hover:text-[#C8A96E] transition-colors">
                        {destacada.titulo}
                      </h3>
                      <p className="text-gray-400 text-sm mt-3 leading-relaxed">{destacada.descripcion}</p>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#C8A96E] rounded-full flex items-center justify-center text-xs">☕</div>
                        <span className="text-gray-400 text-xs">{destacada.fuente}</span>
                      </div>
                      <span className="text-gray-500 text-xs">{destacada.tiempo}</span>
                    </div>
                  </div>
                </a>
              )}

              {secundarias.map((noticia) => (
                <a
                  key={noticia.id}
                  href={noticia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-2xl overflow-hidden shadow-sm group cursor-pointer hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="bg-[#e2d9c6] h-60 flex items-center justify-center overflow-hidden">
                    <img
                      src={noticia.imagen}
                      alt={noticia.categoria}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${categoriaBadgeColors[noticia.categoria] || 'bg-gray-100 text-gray-600'}`}>
                      {noticia.categoria}
                    </span>
                    <h3 className="text-[#2C1A0E] font-bold text-sm mt-3 leading-snug group-hover:text-[#C8A96E] transition-colors">
                      {noticia.titulo}
                    </h3>
                    <p className="text-gray-500 text-xs mt-2 leading-relaxed">{noticia.descripcion}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-gray-400 text-xs">{noticia.fuente}</span>
                      <span className="text-gray-400 text-xs">{noticia.tiempo}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Banner alerta */}
          <div className="mt-8 bg-[#3D1F0F] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{alertasActivas.activas ? '🔔' : '🔕'}</span>
              <div>
                <p className="text-white font-bold text-sm">
                  {alertasActivas.activas ? '¡Alertas activas!' : 'Recibe las noticias en tu celular'}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {alertasActivas.activas
                    ? `Categorías: ${alertasActivas.categorias.length > 0 ? alertasActivas.categorias.join(', ') : 'Todas'}`
                    : 'Activa las notificaciones y entérate cuando el precio suba o haya noticias importantes.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setModalAbierto(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                alertasActivas.activas
                  ? 'bg-white text-[#3D1F0F] hover:bg-gray-100'
                  : 'bg-[#C8A96E] text-white hover:bg-[#B8994E]'
              }`}
            >
              {alertasActivas.activas ? '⚙️ Editar alertas' : '🔔 Activar alertas'}
            </button>
          </div>

        </div>
      </div>

      {modalAbierto && (
        <ModalAlertas
          onClose={() => setModalAbierto(false)}
          alertasActivas={alertasActivas}
          setAlertasActivas={setAlertasActivas}
        />
      )}

      <Footer />
    </div>
  );
}