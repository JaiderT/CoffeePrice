import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContex.jsx';

const TAGS = [
  { value: 'precio_justo', label: 'Precio justo' },
  { value: 'pago_puntual', label: 'Pago puntual' },
  { value: 'buen_trato', label: 'Buen trato' },
  { value: 'precio_real', label: 'Precio real' },
  { value: 'confiable', label: 'Confiable' },
  { value: 'bascula_justa', label: 'Báscula justa' },
];

function Estrellas({ valor, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange && onChange(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`w-10 h-10 rounded-xl border text-lg transition-all duration-150 ${(hover || valor) >= n
              ? 'bg-[#FFF8E7] border-[#C8A96E] text-[#C8A96E]'
              : 'bg-white border-gray-200 text-gray-300'
            } ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function renderEstrellas(n) {
  const llenas = Math.round(n);
  return (
    <span className="text-[#C8A96E]">
      {'★'.repeat(llenas)}
      <span className="text-gray-300">{'★'.repeat(5 - llenas)}</span>
    </span>
  );
}

export default function PerfilPublicoComprador() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  const [comprador, setComprador] = useState(null);
  const [precios, setPrecios] = useState([]);
  const [reseñas, setReseñas] = useState([]);
  const [promedio, setPromedio] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [tagsSeleccionados, setTagsSeleccionados] = useState([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obtenerDatos();
  }, [id]);

  const obtenerDatos = async () => {
    try {
      const [compradorRes, reseñasRes] = await Promise.all([
        axios.get(`${API_URL}/api/comprador/${id}`),
        axios.get(`${API_URL}/api/resenas/comprador/${id}`),
      ]);
      setComprador(compradorRes.data);
      setReseñas(reseñasRes.data.reseñas || []);
      setPromedio(reseñasRes.data.promedio || 0);
      await obtenerPrecios(id);
    } catch (error) {
      console.error('Error al obtener datos:', error);
    } finally {
      setCargando(false);
    }
  };

  const obtenerPrecios = async (compradorId) => {
    try {
      const { data } = await axios.get(`${API_URL}/api/precios/comprador/${compradorId}`);
      setPrecios(data);
    } catch (error) {
      console.error('Error al obtener precios:', error);
    }
  };

  const toggleTag = (tag) => {
    setTagsSeleccionados(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleEnviarReseña = async (e) => {
    e.preventDefault();
    if (calificacion === 0) {
      setMensaje({ tipo: 'error', texto: 'Debes seleccionar una calificación' });
      setTimeout(() => setMensaje(null), 3000);
      return;
    }
    setEnviando(true);
    try {
      const token = localStorage.getItem('token');
      const usuarioId = localStorage.getItem('usuarioId');
      await axios.post(`${API_URL}/api/resenas`, {
        productor: usuarioId,
        comprador: id,
        calificacion,
        comentario,
        tags: tagsSeleccionados,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMensaje({ tipo: 'exito', texto: '¡Reseña publicada correctamente!' });
      setCalificacion(0);
      setComentario('');
      setTagsSeleccionados([]);
      obtenerDatos();
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al publicar la reseña';
      setMensaje({ tipo: 'error', texto: msg });
    } finally {
      setEnviando(false);
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  const iniciales = (nombre) =>
    nombre ? nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  if (cargando) return (
    <div className="min-h-screen bg-[#F7F1E3] flex items-center justify-center">
      <p className="text-[#8B7355]">Cargando...</p>
    </div>
  );

  if (!comprador) return (
    <div className="min-h-screen bg-[#F7F1E3] flex items-center justify-center">
      <p className="text-[#8B7355]">Comprador no encontrado</p>
    </div>
  );

  const precioActual = precios[0];

  return (
    <div className="min-h-screen bg-[#F7F1E3] px-4 py-8">
      <div className="max-w-2xl mx-auto">

        {/* Botón volver */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#8B7355] text-sm mb-6 hover:text-[#2C1A0E] transition-colors">
          <i className="fa-solid fa-arrow-left text-xs"></i> Volver
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-[#E7D9BF] p-6 mb-4 shadow-sm">

          {/* Banner */}
          <div className="h-20 bg-gradient-to-r from-[#3D1F0F] to-[#7A4020] rounded-xl mb-4 relative">
            <div className="absolute -bottom-6 left-6">
              <div className="w-14 h-14 rounded-xl bg-[#C8A96E] flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow">
                {iniciales(comprador.nombreempresa)}
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between mt-8">
            <div>
              <h1 className="text-[#2C1A0E] text-xl font-bold">{comprador.nombreempresa}</h1>
              <p className="text-[#8B7355] text-sm mt-1">
                <i className="fa-solid fa-location-dot mr-1"></i>
                {comprador.direccion || 'Dirección no registrada'}
              </p>
              {comprador.horario && (
                <p className="text-[#8B7355] text-xs mt-1">
                  <i className="fa-solid fa-clock mr-1"></i>
                  {comprador.horario}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#2C1A0E]">{Number(promedio).toFixed(1)}</p>
              <div className="text-sm mt-0.5">{renderEstrellas(promedio)}</div>
              <p className="text-[#8B7355] text-xs mt-1">{reseñas.length} reseñas</p>
            </div>
          </div>

          <hr className="border-[#E7D9BF] my-4" />

          {/* Stats precios */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-[#F7F1E3] rounded-xl p-3">
              <p className="text-[#2C1A0E] text-lg font-bold">
                {precioActual ? precioActual.preciocarga?.toLocaleString() : '---'}
              </p>
              <p className="text-[#8B7355] text-xs mt-1">Precio/carga hoy</p>
            </div>
            <div className="bg-[#F7F1E3] rounded-xl p-3">
              <p className="text-[#2C1A0E] text-lg font-bold">
                {precioActual ? precioActual.preciokg?.toLocaleString() : '---'}
              </p>
              <p className="text-[#8B7355] text-xs mt-1">COP/kg</p>
            </div>
            <div className="bg-[#F7F1E3] rounded-xl p-3">
              <p className="text-[#2C1A0E] text-xs font-semibold leading-tight">
                {comprador.telefono || 'No registrado'}
              </p>
              <p className="text-[#8B7355] text-xs mt-1">Teléfono</p>
            </div>
          </div>
        </div>

        {/* Formulario reseña - solo productores */}
        {usuario?.rol === 'productor' && (
          <div className="bg-white rounded-2xl border border-[#E7D9BF] p-6 mb-4 shadow-sm">
            <h2 className="text-[#2C1A0E] font-bold text-base mb-4">
              <i className="fa-solid fa-star text-[#C8A96E] mr-2"></i>
              Dejar una reseña
            </h2>

            {mensaje && (
              <div className={`px-4 py-3 rounded-xl mb-4 text-sm font-semibold ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
              </div>
            )}

            <form onSubmit={handleEnviarReseña}>
              <p className="text-xs font-semibold text-[#8B7355] uppercase mb-2">Calificación</p>
              <div className="mb-4">
                <Estrellas valor={calificacion} onChange={setCalificacion} />
              </div>

              <p className="text-xs font-semibold text-[#8B7355] uppercase mb-2">Tags (opcional)</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {TAGS.map(tag => (
                  <button key={tag.value} type="button" onClick={() => toggleTag(tag.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${tagsSeleccionados.includes(tag.value)
                        ? 'bg-[#FFF8E7] border-[#C8A96E] text-[#7A4020]'
                        : 'bg-white border-gray-200 text-[#8B7355] hover:border-[#C8A96E]'
                      }`}>
                    {tag.label}
                  </button>
                ))}
              </div>

              <p className="text-xs font-semibold text-[#8B7355] uppercase mb-2">Comentario (opcional)</p>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Escribe tu experiencia con este comprador..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none h-20 focus:outline-none focus:border-[#C8A96E] bg-[#F7F1E3] text-[#2C1A0E] placeholder-gray-400"
              />
              <button type="submit" disabled={enviando}
                className="mt-3 w-full py-3 rounded-xl bg-[#2C1A0E] text-white text-sm font-semibold hover:bg-[#3D1F0F] transition-colors disabled:opacity-60">
                {enviando ? 'Publicando...' : 'Publicar reseña'}
              </button>
            </form>
          </div>
        )}

        {/* Banner login para visitantes */}
        {!usuario && (
          <div className="bg-[#FFF8E7] border border-[#C8A96E]/30 rounded-2xl px-6 py-4 mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-lock text-[#C8A96E]"></i>
              <p className="text-[#2C1A0E] text-sm font-semibold">Inicia sesión para dejar una reseña</p>
            </div>
            <Link to="/login"
              className="bg-[#2C1A0E] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#3D1F0F] transition-colors whitespace-nowrap">
              Iniciar sesión
            </Link>
          </div>
        )}

        {/* Lista de reseñas */}
        <div className="bg-white rounded-2xl border border-[#E7D9BF] p-6 shadow-sm">
          <h2 className="text-[#2C1A0E] font-bold text-base mb-4">
            Reseñas ({reseñas.length})
          </h2>

          {reseñas.length === 0 ? (
            <div className="text-center py-8">
              <i className="fa-solid fa-star text-gray-200 text-4xl mb-3"></i>
              <p className="text-[#8B7355] text-sm">Aún no hay reseñas para este comprador</p>
              <p className="text-gray-400 text-xs mt-1">Sé el primero en dejar una reseña</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reseñas.map((r, i) => (
                <div key={i} className="bg-[#F7F1E3] rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#C8A96E] flex items-center justify-center text-white text-xs font-bold">
                        {iniciales(`${r.productor?.nombre} ${r.productor?.apellido}`)}
                      </div>
                      <div>
                        <p className="text-[#2C1A0E] text-sm font-semibold">
                          {r.productor?.nombre} {r.productor?.apellido}
                        </p>
                        <p className="text-[#8B7355] text-xs">
                          {new Date(r.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm">{renderEstrellas(r.calificacion)}</div>
                  </div>
                  {r.comentario && (
                    <p className="text-[#6B5A4D] text-sm mb-2">{r.comentario}</p>
                  )}
                  {r.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.tags.map((tag, j) => (
                        <span key={j} className="bg-[#FFF8E7] text-[#7A4020] text-xs px-2.5 py-1 rounded-full border border-[#C8A96E]/30">
                          {TAGS.find(t => t.value === tag)?.label || tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
