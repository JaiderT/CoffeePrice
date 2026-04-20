import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';
import Navbar from '../Layout/Navbar.jsx';
import Sidebar from '../Layout/Sidebar.jsx';
import Footer from '../Layout/Footer.jsx';

const API_URL = import.meta.env.VITE_API_URL;

const CATEGORIAS = [
  { value: 'todas', label: 'Todas' },
  { value: 'mercado', label: ' Precios del café' },
  { value: 'internacional', label: ' Mercado internacional' },
  { value: 'clima', label: 'Clima y cosechas' },
  { value: 'fnc', label: 'Federación Cafeteros' },
  { value: 'produccion', label: 'Producción' },
  { value: 'consejos', label: 'Consejos para caficultores' },
  { value: 'el_pital', label: 'Noticias de El Pital' },
];

const categoriaBadgeColors = {
  mercado: 'bg-amber-50 text-amber-700',
  internacional: 'bg-blue-50 text-blue-700',
  clima: 'bg-sky-50 text-sky-700',
  fnc: 'bg-purple-50 text-purple-700',
  produccion: 'bg-green-50 text-green-700',
  consejos: 'bg-[#FFF3E0] text-[#C8A96E]',
  el_pital: 'bg-emerald-50 text-emerald-700',
};

const categoriaEmoji = {
  mercado: '📈',
  internacional: '🌎',
  clima: '🌧️',
  fnc: '🏛️',
  produccion: '🌱',
  consejos: '💡',
  el_pital: '⛰️',
};

function ModalAlertas({ onClose, alertasActivas, setAlertasActivas }) {
  const [paso, setPaso] = useState('seleccion');
  const [cargando, setCargando] = useState(false);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState(
    alertasActivas.categorias || []
  );
  const [canalesSeleccionados, setCanalesSeleccionados] = useState({
    push: alertasActivas.canales?.push ?? true,
    email: alertasActivas.canales?.email ?? false,
  });

  const categorias = CATEGORIAS.filter(c => c.value !== 'todas');
  const token = localStorage.getItem('token');
  const usuarioId = localStorage.getItem('usuarioId');

  const toggleCategoria = (id) => {
    setCategoriasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const activarNotificaciones = async () => {
    setCargando(true);
    try {
      if (canalesSeleccionados.push) {
        if (!('Notification' in window)) {
          alert('Tu navegador no soporta notificaciones push.');
          setCargando(false);
          return;
        }
        const permiso = await Notification.requestPermission();
        if (permiso !== 'granted') {
          setPaso('denegado');
          setCargando(false);
          return;
        }
      }

      if (token && usuarioId) {
        await fetch(`${API_URL}/api/alertas-noticias`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            categorias: categoriasSeleccionadas,
            canales: canalesSeleccionados,
            activa: true,
          }),
        });
      }

      const config = { activas: true, categorias: categoriasSeleccionadas, canales: canalesSeleccionados };
      localStorage.setItem('coffeprice_alertas', JSON.stringify(config));
      setAlertasActivas(config);

      if (canalesSeleccionados.push) {
        new Notification('¡Alertas activadas! ☕', {
          body: categoriasSeleccionadas.length > 0
            ? `Recibirás noticias de: ${categoriasSeleccionadas.join(', ')}`
            : 'Recibirás todas las noticias del café',
          icon: '/favicon.ico',
        });
      }

      setPaso('exito');
    } catch (error) {
      console.error('Error al activar alertas:', error);
      setPaso('exito');
    } finally {
      setCargando(false);
    }
  };

  const desactivar = async () => {
    try {
      if (token && usuarioId) {
        await fetch(`${API_URL}/api/alertas-noticias`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error('Error al desactivar alertas:', error);
    } finally {
      localStorage.removeItem('coffeprice_alertas');
      setAlertasActivas({ activas: false, categorias: [] });
      onClose();
    }
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
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${activa ? 'bg-[#C8A96E] border-[#C8A96E]' : 'border-gray-300'}`}>
                        {activa && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-[#2C1A0E] text-xs font-semibold uppercase mb-3">Canales de notificación</p>
              <div className="space-y-2 mb-4">
                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${canalesSeleccionados.push ? 'border-[#C8A96E] bg-[#FFF8E7]' : 'border-gray-200 bg-gray-50'}`}>
                  <div>
                    <p className="text-sm font-semibold text-[#2C1A0E]">🔔 Notificación push</p>
                    <p className="text-xs text-gray-400">En el navegador cuando estés en la app</p>
                  </div>
                  <input type="checkbox" checked={canalesSeleccionados.push}
                    onChange={e => setCanalesSeleccionados({ ...canalesSeleccionados, push: e.target.checked })}
                    className="w-4 h-4 accent-[#C8A96E]" />
                </label>
                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${canalesSeleccionados.email ? 'border-[#C8A96E] bg-[#FFF8E7]' : 'border-gray-200 bg-gray-50'}`}>
                  <div>
                    <p className="text-sm font-semibold text-[#2C1A0E]">✉️ Correo electrónico</p>
                    <p className="text-xs text-gray-400">Te enviamos un correo cuando haya una nueva noticia</p>
                  </div>
                  <input type="checkbox" checked={canalesSeleccionados.email}
                    onChange={e => setCanalesSeleccionados({ ...canalesSeleccionados, email: e.target.checked })}
                    className="w-4 h-4 accent-[#C8A96E]" />
                </label>
              </div>

              <p className="text-gray-400 text-xs mb-4 text-center">
                {categoriasSeleccionadas.length === 0
                  ? 'Sin selección recibirás alertas de todas las categorías'
                  : `${categoriasSeleccionadas.length} categoría${categoriasSeleccionadas.length > 1 ? 's' : ''} seleccionada${categoriasSeleccionadas.length > 1 ? 's' : ''}`}
              </p>
              <button onClick={activarNotificaciones} disabled={cargando}
                className="w-full bg-[#3D1F0F] text-white py-3 rounded-full font-semibold text-sm hover:bg-[#5a2e18] transition-colors disabled:opacity-60">
                {cargando ? 'Activando...' : '🔔 Activar notificaciones'}
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
              <p className="text-gray-500 text-sm mb-2">Te avisaremos cuando haya noticias importantes del café.</p>
              {canalesSeleccionados.email && (
                <p className="text-[#C8A96E] text-xs mb-4">✉️ También recibirás un correo electrónico</p>
              )}
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
  const { usuario, cargando: cargandoAuth } = useAuth();
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

  const obtenerNoticias = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (categoriaActiva !== 'todas') params.set('categoria', categoriaActiva);
      params.set('_ts', Date.now().toString());
      const { data } = await axios.get(`${API_URL}/api/noticias?${params.toString()}`);
      setNoticias(data);
    } catch (error) {
      console.error('Error al obtener noticias:', error);
    } finally {
      setCargando(false);
    }
  }, [categoriaActiva]);

  // Cargar alerta del backend si está logueado
  useEffect(() => {
    const cargarAlertaBackend = async () => {
      const token = localStorage.getItem('token');
      const usuarioId = localStorage.getItem('usuarioId');
      if (!token || !usuarioId) return;
      try {
        const res = await fetch(`${API_URL}/api/alertas-noticias/usuario/${usuarioId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data && data.activa) {
          setAlertasActivas({
            activas: true,
            categorias: data.categorias || [],
            canales: data.canales || { push: true, email: false },
          });
        }
      } catch { /* silencioso */ }
    };
    cargarAlertaBackend();
  }, []);

  useEffect(() => {
    obtenerNoticias();
  }, [obtenerNoticias]);

  const destacada = noticias[0];
  const secundarias = noticias.slice(1);

  const formatearFechaNoticia = (noticia, corta = false) => {
    const fecha = noticia.publishedAt || noticia.createdAt;
    return new Date(fecha).toLocaleDateString(
      'es-CO',
      corta
        ? { day: '2-digit', month: 'short' }
        : { day: '2-digit', month: 'short', year: 'numeric' }
    );
  };

  const etiquetaImagen = (noticia) =>
    noticia.tipoImagen === 'source' ? 'Imagen de la fuente' : 'Imagen de apoyo';

  const contenido = (
    <div className="w-full bg-[#F5ECD7] py-12 md:py-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-7">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[#C8A96E] text-xs font-semibold uppercase tracking-widest">Al día con el campo</p>
            <h2 className="text-[#2C1A0E] text-3xl md:text-4xl font-bold mt-2">Noticias del café</h2>
            <p className="text-gray-500 text-sm mt-2">Lo más relevante del sector cafetero colombiano e internacional.</p>
          </div>
        </div>

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

        {cargando && (
          <div className="text-center py-16 text-gray-400 text-sm">Cargando noticias...</div>
        )}

        {!cargando && noticias.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            No hay noticias en esta categoría por el momento.
          </div>
        )}

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
                    <span className="text-gray-500 text-xs">{formatearFechaNoticia(destacada)}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 mt-3">{etiquetaImagen(destacada)}</span>
                  {destacada.sourceUrl && (
                    <a href={destacada.sourceUrl} target="_blank" rel="noreferrer"
                      className="inline-flex mt-4 text-[#C8A96E] text-xs font-semibold hover:text-white transition-colors">
                      Ver fuente original
                    </a>
                  )}
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
                    <span className="text-gray-400 text-xs">{formatearFechaNoticia(noticia, true)}</span>
                  </div>
                  <span className="block text-[11px] text-gray-400 mt-2">{etiquetaImagen(noticia)}</span>
                  {noticia.sourceUrl && (
                    <a href={noticia.sourceUrl} target="_blank" rel="noreferrer"
                      className="inline-flex mt-3 text-[#8B6B45] text-[11px] font-semibold hover:text-[#3D1F0F] transition-colors">
                      Leer fuente
                    </a>
                  )}
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
                {alertasActivas.activas ? '¡Alertas activas!' : 'Recibe las notificaciones en tu dispositivo'}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                {alertasActivas.activas
                  ? `Categorías: ${alertasActivas.categorias.length > 0 ? alertasActivas.categorias.join(', ') : 'Todas'}`
                  : 'Activa las notificaciones y entérate cuando haya noticias importantes.'}
              </p>
            </div>
          </div>
          <button onClick={() => setModalAbierto(true)}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${alertasActivas.activas ? 'bg-white text-[#3D1F0F] hover:bg-gray-100' : 'bg-[#C8A96E] text-white hover:bg-[#B8994E]'}`}>
            {alertasActivas.activas ? '⚙️ Editar alertas' : '🔔 Activar alertas'}
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <>
      {!cargandoAuth && usuario ? (
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="ml-16 flex-1">
            {contenido}
          </div>
        </div>
      ) : !cargandoAuth && !usuario ? (
        <div className="bg-[#2C1A0E]">
          <Navbar />
          {contenido}
          <Footer />
        </div>
      ) : (
        <div className="min-h-screen bg-[#F7F1E3] flex items-center justify-center">
          <p className="text-[#8B7355]">Cargando...</p>
        </div>
      )}
      {modalAbierto && (
        <ModalAlertas
          onClose={() => setModalAbierto(false)}
          alertasActivas={alertasActivas}
          setAlertasActivas={setAlertasActivas}
        />
      )}
    </>
  );
}
