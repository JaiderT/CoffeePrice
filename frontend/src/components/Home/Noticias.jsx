import { useState, useEffect } from 'react';
import Navbar from '../Layout/Navbar';
import Footer from '../Layout/Footer';

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
    { id: 'Precios del café', desc: 'Cuando el precio suba o baje' },
    { id: 'Mercado internacional', desc: 'Bolsa de NY y mercados globales' },
    { id: 'Clima y cosechas', desc: 'Alertas de clima y cosechas' },
    { id: 'Noticias del sector', desc: 'FNC, subsidios y política cafetera' },
  ];

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

      localStorage.setItem(
        'coffeprice_alertas',
        JSON.stringify(config)
      );

      setAlertasActivas(config);

      new Notification('¡Alertas activadas! ☕', {
        body:
          categoriasSeleccionadas.length > 0
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
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#3D1F0F] px-6 pt-6 pb-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>

          <div className="text-4xl mb-3">🔔</div>

          <h3 className="text-white text-xl font-bold">
            Alertas de noticias
          </h3>

          <p className="text-gray-400 text-sm mt-1">
            Entérate al instante cuando haya novedades del café
          </p>
        </div>

        <div className="px-6 py-6">
          {paso === 'seleccion' && (
            <>
              <p className="text-[#2C1A0E] text-sm font-semibold mb-4">
                ¿Sobre qué quieres recibir alertas?
              </p>

              <div className="space-y-2 mb-5">
                {categorias.map((cat) => {
                  const activa = categoriasSeleccionadas.includes(cat.id);

                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategoria(cat.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                        activa
                          ? 'border-[#C8A96E] bg-[#FFF8EF]'
                          : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-xs font-bold">
                          {cat.id}
                        </p>

                        <p className="text-xs text-gray-400">
                          {cat.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={activarNotificaciones}
                className="w-full bg-[#3D1F0F] text-white py-3 rounded-full font-semibold text-sm"
              >
                🔔 Activar notificaciones
              </button>

              {alertasActivas.activas && (
                <button
                  onClick={desactivar}
                  className="w-full mt-2 text-red-400 text-xs py-2"
                >
                  Desactivar alertas
                </button>
              )}
            </>
          )}

          {paso === 'exito' && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>

              <h4 className="text-[#2C1A0E] font-bold text-lg mb-2">
                ¡Alertas activadas!
              </h4>

              <button
                onClick={onClose}
                className="w-full bg-[#C8A96E] text-white py-3 rounded-full font-semibold text-sm"
              >
                Perfecto, cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Noticias() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [modalAbierto, setModalAbierto] = useState(false);

  const [alertasActivas, setAlertasActivas] = useState(() => {
    try {
      const guardado = localStorage.getItem('coffeprice_alertas');
      return guardado
        ? JSON.parse(guardado)
        : { activas: false, categorias: [] };
    } catch {
      return { activas: false, categorias: [] };
    }
  });

  useEffect(() => {
    obtenerNoticias();
  }, []);

  const obtenerNoticias = async () => {
    try {
      const response = await fetch(
        'http://localhost:8081/api/noticias'
      );

      const data = await response.json();

      setNoticias(data);
    } catch (error) {
      console.error('Error cargando noticias:', error);
    } finally {
      setLoading(false);
    }
  };

  const noticiasFiltradas =
    categoriaActiva === 'Todas'
      ? noticias
      : noticias.filter(
          (n) => n.categoria === categoriaActiva
        );

  const destacada = noticiasFiltradas.find(
    (n) => n.destacada
  );

  const secundarias = noticiasFiltradas.filter(
    (n) => !n.destacada
  );

  return (
    <div className="bg-[#2C1A0E]">
      <Navbar />

      <div className="w-full bg-[#F5ECD7] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-[#C8A96E] text-xs font-semibold uppercase tracking-widest">
                Al día con el campo
              </p>

              <h2 className="text-[#2C1A0E] text-3xl md:text-4xl font-bold mt-2">
                Noticias del café
              </h2>

              <p className="text-gray-500 text-sm mt-2">
                Lo más relevante del sector cafetero.
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap mb-8">
            {[
              'Todas',
              'Precios del café',
              'Mercado internacional',
              'Clima y cosechas',
              'Noticias del sector',
            ].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                  categoriaActiva === cat
                    ? 'bg-[#3D1F0F] text-white'
                    : 'bg-white text-[#3D1F0F] border border-[#D4B898]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading && (
            <div className="text-center py-16 text-gray-400">
              Cargando noticias...
            </div>
          )}

          {!loading && noticiasFiltradas.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              No hay noticias disponibles.
            </div>
          )}

          {!loading && noticiasFiltradas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destacada && (
                <a
                  href={destacada.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lg:col-span-2 bg-[#3D1F0F] rounded-2xl overflow-hidden shadow-md group"
                >
                  <div className="p-6 md:p-8">
                    <span className="bg-[#C8A96E] text-[#3D1F0F] text-xs font-bold px-3 py-1 rounded-full">
                      {destacada.categoria}
                    </span>

                    <h3 className="text-white text-xl md:text-2xl font-bold mt-4">
                      {destacada.titulo}
                    </h3>

                    <p className="text-gray-400 text-sm mt-3">
                      {destacada.descripcion}
                    </p>
                  </div>
                </a>
              )}

              {secundarias.map((noticia) => (
                <a
                  key={noticia._id}
                  href={noticia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-2xl overflow-hidden shadow-sm group"
                >
                  <div className="h-60 overflow-hidden">
                    <img
                      src={noticia.imagen}
                      alt={noticia.categoria}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-5">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        categoriaBadgeColors[
                          noticia.categoria
                        ] || 'bg-gray-100'
                      }`}
                    >
                      {noticia.categoria}
                    </span>

                    <h3 className="text-[#2C1A0E] font-bold text-sm mt-3">
                      {noticia.titulo}
                    </h3>

                    <p className="text-gray-500 text-xs mt-2">
                      {noticia.descripcion}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalAbierto && (
        <ModalAlertas
          onClose={() => setModalAbierto(false)}
          alertasActivas={alertasActivas}
          setAlertasActivas={setAlertasActivas}
        />
      )}
    </div>
  );
}