import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';
import Navbar from '../Layout/Navbar.jsx';
import Sidebar from '../Layout/Sidebar.jsx';
import Footer from '../Layout/Footer.jsx';

const API_URL = import.meta.env.VITE_API_URL;

const CATEGORIAS = [
  { value: 'todas', label: 'Todas' },
  { value: 'mercado', label: 'Precios del cafe' },
  { value: 'internacional', label: 'Mercado internacional' },
  { value: 'clima', label: 'Clima y cosechas' },
  { value: 'fnc', label: 'Federacion Cafeteros' },
  { value: 'produccion', label: 'Produccion' },
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
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState(alertasActivas.categorias || []);
  const [canalesSeleccionados, setCanalesSeleccionados] = useState({
    push: alertasActivas.canales?.push ?? true,
    email: alertasActivas.canales?.email ?? false,
  });

  const categorias = CATEGORIAS.filter((categoria) => categoria.value !== 'todas');
  const usuarioId = localStorage.getItem('usuarioId');

  const toggleCategoria = (id) => {
    setCategoriasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((categoria) => categoria !== id) : [...prev, id]
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

      if (usuarioId) {
        await fetch(`${API_URL}/api/alertas-noticias`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            categorias: categoriasSeleccionadas,
            canales: canalesSeleccionados,
            activa: true,
          }),
        });
      }

      const config = {
        activas: true,
        categorias: categoriasSeleccionadas,
        canales: canalesSeleccionados,
      };

      localStorage.setItem('coffeprice_alertas', JSON.stringify(config));
      setAlertasActivas(config);

      if (canalesSeleccionados.push) {
        new Notification('Alertas activadas', {
          body: categoriasSeleccionadas.length > 0
            ? `Recibiras noticias de: ${categoriasSeleccionadas.join(', ')}`
            : 'Recibiras todas las noticias del cafe',
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
      if (usuarioId) {
        await fetch(`${API_URL}/api/alertas-noticias`, {
          method: 'DELETE',
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Error al desactivar alertas:', error);
    } finally {
      localStorage.removeItem('coffeprice_alertas');
      setAlertasActivas({ activas: false, categorias: [], canales: { push: true, email: false } });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#3D1F0F] px-6 pt-6 pb-8">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-xl leading-none">×</button>
          <div className="text-4xl mb-3">🔔</div>
          <h3 className="text-white text-xl font-bold">Alertas de noticias</h3>
          <p className="text-gray-400 text-sm mt-1">Enterate al instante cuando haya novedades del cafe</p>
        </div>
        <div className="px-6 py-6">
          {paso === 'seleccion' && (
            <>
              <p className="text-[#2C1A0E] text-sm font-semibold mb-4">Sobre que quieres recibir alertas?</p>
              <div className="space-y-2 mb-5">
                {categorias.map((categoria) => {
                  const activa = categoriasSeleccionadas.includes(categoria.value);
                  return (
                    <button
                      key={categoria.value}
                      onClick={() => toggleCategoria(categoria.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${activa ? 'border-[#C8A96E] bg-[#FFF8EF]' : 'border-gray-100 bg-gray-50 hover:border-[#D4B898]'}`}
                    >
                      <span className="text-xl">{categoriaEmoji[categoria.value]}</span>
                      <div className="flex-1">
                        <p className={`text-xs font-bold ${activa ? 'text-[#3D1F0F]' : 'text-gray-600'}`}>{categoria.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2 mb-4">
                {[
                  { key: 'push', label: 'Notificacion push', desc: 'En el navegador cuando estes en la app' },
                  { key: 'email', label: 'Correo electronico', desc: 'Te enviaremos un correo con la noticia' },
                ].map((canal) => (
                  <label key={canal.key} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${canalesSeleccionados[canal.key] ? 'border-[#C8A96E] bg-[#FFF8E7]' : 'border-gray-200 bg-gray-50'}`}>
                    <div>
                      <p className="text-sm font-semibold text-[#2C1A0E]">{canal.label}</p>
                      <p className="text-xs text-gray-400">{canal.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={canalesSeleccionados[canal.key]}
                      onChange={(e) => setCanalesSeleccionados({ ...canalesSeleccionados, [canal.key]: e.target.checked })}
                      className="w-4 h-4 accent-[#C8A96E]"
                    />
                  </label>
                ))}
              </div>
              <button onClick={activarNotificaciones} disabled={cargando} className="w-full bg-[#3D1F0F] text-white py-3 rounded-full font-semibold text-sm hover:bg-[#5a2e18] transition-colors disabled:opacity-60">
                {cargando ? 'Activando...' : 'Activar notificaciones'}
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
              <h4 className="text-[#2C1A0E] font-bold text-lg mb-2">Alertas activadas</h4>
              <p className="text-gray-500 text-sm mb-2">Te avisaremos cuando haya noticias importantes del cafe.</p>
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
      return guardado ? JSON.parse(guardado) : { activas: false, categorias: [], canales: { push: true, email: false } };
    } catch {
      return { activas: false, categorias: [], canales: { push: true, email: false } };
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

  useEffect(() => {
    const cargarAlertaBackend = async () => {
      const usuarioId = localStorage.getItem('usuarioId');
      if (!usuarioId) return;
      try {
        const res = await fetch(`${API_URL}/api/alertas-noticias/usuario/${usuarioId}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (data && data.activa) {
          setAlertasActivas({
            activas: true,
            categorias: data.categorias || [],
            canales: data.canales || { push: true, email: false },
          });
        }
      } catch {
        // silencioso
      }
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
    return new Date(fecha).toLocaleDateString('es-CO', corta ? { day: '2-digit', month: 'short' } : { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const etiquetaImagen = (noticia) => noticia.tipoImagen === 'source' ? 'Imagen de la fuente' : 'Imagen de apoyo';

  const contenido = (
    <div className="w-full bg-[#F5ECD7] py-12 md:py-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-7">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[#C8A96E] text-xs font-semibold uppercase tracking-widest">Al dia con el campo</p>
            <h2 className="text-[#2C1A0E] text-3xl md:text-4xl font-bold mt-2">Noticias del cafe</h2>
            <p className="text-gray-500 text-sm mt-2">Lo mas relevante del sector cafetero colombiano e internacional.</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIAS.map((categoria) => (
            <button
              key={categoria.value}
              onClick={() => setCategoriaActiva(categoria.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${categoriaActiva === categoria.value ? 'bg-[#3D1F0F] text-white' : 'bg-white text-[#3D1F0F] border border-[#D4B898] hover:bg-[#3D1F0F] hover:text-white'}`}
            >
              {categoria.label}
            </button>
          ))}
        </div>

        {cargando && <div className="text-center py-16 text-gray-400 text-sm">Cargando noticias...</div>}
        {!cargando && noticias.length === 0 && <div className="text-center py-16 text-gray-400 text-sm">No hay noticias en esta categoria por el momento.</div>}

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
                    <h3 className="text-white text-xl md:text-2xl font-bold mt-4 leading-snug group-hover:text-[#C8A96E] transition-colors">{destacada.titulo}</h3>
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
                    <a href={destacada.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex mt-4 text-[#C8A96E] text-xs font-semibold hover:text-white transition-colors">
                      Ver fuente original
                    </a>
                  )}
                  <Link to={`/noticias/${destacada._id}`} className="inline-flex mt-3 text-white text-sm font-semibold hover:text-[#C8A96E] transition-colors">
                    Ver resumen
                  </Link>
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
                  <h3 className="text-[#2C1A0E] font-bold text-sm mt-3 leading-snug group-hover:text-[#C8A96E] transition-colors">{noticia.titulo}</h3>
                  <p className="text-gray-500 text-xs mt-2 leading-relaxed">{noticia.resumen}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-gray-400 text-xs">{noticia.fuente || 'CoffePrice'}</span>
                    <span className="text-gray-400 text-xs">{formatearFechaNoticia(noticia, true)}</span>
                  </div>
                  <span className="block text-[11px] text-gray-400 mt-2">{etiquetaImagen(noticia)}</span>
                  <Link to={`/noticias/${noticia._id}`} className="inline-flex mt-4 text-[#3D1F0F] text-sm font-semibold hover:text-[#C8A96E] transition-colors">
                    Ver resumen
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-[#3D1F0F] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-3xl">{alertasActivas.activas ? '🔔' : '🔕'}</span>
            <div>
              <p className="text-white font-bold text-sm">
                {alertasActivas.activas ? 'Alertas activas' : 'Recibe las notificaciones en tu dispositivo'}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                {alertasActivas.activas
                  ? `Categorias: ${alertasActivas.categorias.length > 0 ? alertasActivas.categorias.join(', ') : 'Todas'}`
                  : 'Activa las notificaciones y enterate cuando haya noticias importantes.'}
              </p>
            </div>
          </div>
          <button onClick={() => setModalAbierto(true)} className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${alertasActivas.activas ? 'bg-white text-[#3D1F0F] hover:bg-gray-100' : 'bg-[#C8A96E] text-white hover:bg-[#B8994E]'}`}>
            {alertasActivas.activas ? 'Editar alertas' : 'Activar alertas'}
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
          <div className="ml-16 flex-1">{contenido}</div>
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
        <ModalAlertas onClose={() => setModalAbierto(false)} alertasActivas={alertasActivas} setAlertasActivas={setAlertasActivas} />
      )}
    </>
  );
}
