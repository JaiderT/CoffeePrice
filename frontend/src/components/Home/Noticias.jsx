import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../Layout/Navbar';
import Footer from '../Layout/Footer';
import Sidebar from '../Layout/Sidebar';
import { useAuth } from '../../context/AuthContex.jsx';

const API_URL = import.meta.env.VITE_API_URL;

const CATEGORIAS = [
  { value: 'todas', label: 'Todas' },
  { value: 'mercado', label: '📈 Precios del café' },
  { value: 'internacional', label: '🌎 Mercado internacional' },
  { value: 'clima', label: '🌧️ Clima y cosechas' },
  { value: 'fnc', label: '🏛️ Federación Cafeteros' },
  { value: 'produccion', label: '🌱 Producción' },
  { value: 'consejos', label: '💡 Consejos para caficultores' },
];

const categoriaBadgeColors = {
  mercado: 'bg-amber-50 text-amber-700',
  internacional: 'bg-blue-50 text-blue-700',
  clima: 'bg-sky-50 text-sky-700',
  fnc: 'bg-purple-50 text-purple-700',
  produccion: 'bg-green-50 text-green-700',
  consejos: 'bg-[#FFF3E0] text-[#C8A96E]',
};

const categoriaEmoji = {
  mercado: '📈',
  internacional: '🌎',
  clima: '🌧️',
  fnc: '🏛️',
  produccion: '🌱',
  consejos: '💡',
};

function ModalAlertas({ onClose, alertasActivas, setAlertasActivas }) {
  const [paso, setPaso] = useState('seleccion');
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState(
    alertasActivas.categorias || []
  );

  const categorias = CATEGORIAS.filter(c => c.value !== 'todas');

  const toggleCategoria = (id) => {
    setCategoriasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const activarNotificaciones = async () => {
    if (!('Notification' in window)) {
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
                  const activa = categoriasSeleccionadas.includes(cat.value);
                  return (
                    <button key={cat.value} onClick={() => toggleCategoria(cat.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${activa ? 'border-[#C8A96E] bg-[#FFF8EF]' : 'border-gray-100 bg-gray-50 hover:border-[#D4B898]'}`}>
                      <span className="text-xl">{categoriaEmoji[cat.value]}</span>
                      <div className="flex-1">
                        <p className={`text-xs font-bold ${activa ? 'text-[#3D1F0F]' : 'text-gray-600'}`}>{cat.label}</p>
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
              <p className="text-gray-500 text-sm mb-6">Te avisaremos cuando haya noticias importantes del café.</p>
              <button onClick={onClose} className="w-full bg-[#C8A96E] text-white py-3 rounded-full font-semibold text-sm hover:bg-[#B8994E] transition-colors">
                Perfecto, cerrar
              </button>
            </div>
          )}
          {paso === 'denegado' && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🚫</div>
              <h4 className="text-[#2C1A0E] font-bold text-lg mb-2">Permiso denegado</h4>
              <p className="text-gray-500 text-sm mb-4">Bloqueaste las notificaciones en tu navegador.</p>
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
  const { usuario } = useAuth();
  const [categoriaActiva, setCategoriaActiva] = useState('todas');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [alertasActivas, setAlertasActivas] = useState(() => {
    try {
      const guardado = localStorage.getItem('coffeprice_alertas');
      return guardado ? JSON.parse(guardado) : { activas: false, categorias: [] };
    } catch {
      return { activas: false, categorias: [] };
    }
  });

  useEffect(() => {
    obtenerNoticias();
  }, [categoriaActiva]);

  const obtenerNoticias = async () => {
    setCargando(true);
    try {
      const params = categoriaActiva !== 'todas' ? `?categoria=${categoriaActiva}` : '';
      const { data } = await axios.get(`${API_URL}/api/noticias${params}`);
      setNoticias(data);
    } catch (error) {
      console.error('Error al obtener noticias:', error);
    } finally {
      setCargando(false);
    }
  };

  const destacada = noticias[0];
  const secundarias = noticias.slice(1);

  const contenido = (
    <div className="w-full bg-[#F5ECD7] py-12 md:py-16 min-h-screen">
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
          {CATEGORIAS.map((cat, i) => (
            <button key={i} onClick={() => setCategoriaActiva(cat.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${categoriaActiva === cat.value
                  ? 'bg-[#3D1F0F] text-white'
                  : 'bg-white text-[#3D1F0F] border border-[#D4B898] hover:bg-[#3D1F0F] hover:text-white'
                }`}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Cargando */}
        {cargando && (
          <div className="text-center py-16 text-gray-400 text-sm">Cargando noticias...</div>
        )}

        {/* Sin resultados */}
        {!cargando && noticias.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            No hay noticias en esta categoría por el momento.
          </div>
        )}

        {/* Grid noticias */}
        {!cargando && noticias.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destacada && (
              <div className={`${secundarias.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} bg-[#3D1F0F] rounded-2xl overflow-hidden shadow-md group hover:-translate-y-1 transition-transform duration-300`}>
                {destacada.imagen && (
                  <div className="h-48 overflow-hidden">
                    <img src={destacada.imagen} alt={destacada.titulo} className="w-full h-full object-cover opacity-60" />
                  </div>
                )}
                <div className="p-6 md:p-8 flex flex-col justify-between">
                  <div>
                    <span className="bg-[#C8A96E] text-[#3D1F0F] text-xs font-bold px-3 py-1 rounded-full">
                      {categoriaEmoji[destacada.categoria]} {destacada.categoria}
                    </span>
                    <h3 className="text-white text-xl md:text-2xl font-bold mt-4 leading-snug group-hover:text-[#C8A96E] transition-colors">
                      {destacada.titulo}
                    </h3>
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed">{destacada.resumen}</p>
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#C8A96E] rounded-full flex items-center justify-center text-xs">☕</div>
                      <span className="text-gray-400 text-xs">{destacada.fuente || 'CoffePrice'}</span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {new Date(destacada.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {secundarias.map((noticia) => (
              <div key={noticia._id} className="bg-white rounded-2xl overflow-hidden shadow-sm group hover:-translate-y-1 transition-transform duration-300">
                <div className="bg-[#e2d9c6] h-48 flex items-center justify-center overflow-hidden">
                  {noticia.imagen ? (
                    <img src={noticia.imagen} alt={noticia.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">{categoriaEmoji[noticia.categoria] || '☕'}</span>
                  )}
                </div>
                <div className="p-5">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${categoriaBadgeColors[noticia.categoria] || 'bg-gray-100 text-gray-600'}`}>
                    {categoriaEmoji[noticia.categoria]} {noticia.categoria}
                  </span>
                  <h3 className="text-[#2C1A0E] font-bold text-sm mt-3 leading-snug group-hover:text-[#C8A96E] transition-colors">
                    {noticia.titulo}
                  </h3>
                  <p className="text-gray-500 text-xs mt-2 leading-relaxed">{noticia.resumen}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-gray-400 text-xs">{noticia.fuente || 'CoffePrice'}</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(noticia.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
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
          <button onClick={() => setModalAbierto(true)}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${alertasActivas.activas ? 'bg-white text-[#3D1F0F] hover:bg-gray-100' : 'bg-[#C8A96E] text-white hover:bg-[#B8994E]'
              }`}>
            {alertasActivas.activas ? '⚙️ Editar alertas' : '🔔 Activar alertas'}
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <>
      {usuario ? (
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="ml-16 flex-1">
            {contenido}
          </div>
        </div>
      ) : (
        <div className="bg-[#2C1A0E]">
          <Navbar />
          {contenido}
          <Footer />
        </div>
      )}

      {modalAbierto && (
        <ModalAlertas
          onClose={() => setModalAbierto(false)}
          alertasActivas={alertasActivas}
          setAlertasActivas={setAlertasActivas}
        />
      )}
    </div>
    </>
  );
}
