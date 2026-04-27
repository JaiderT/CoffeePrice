import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';
import Sidebar from '../Layout/Sidebar.jsx';
import Navbar from '../Layout/Navbar.jsx';

const TAGS = [
  { value: 'precio_justo', label: 'Precio justo' },
  { value: 'pago_puntual', label: 'Pago puntual' },
  { value: 'buen_trato', label: 'Buen trato' },
  { value: 'precio_real', label: 'Precio real' },
  { value: 'confiable', label: 'Confiable' },
  { value: 'bascula_justa', label: 'Bascula justa' },
];

const LABELS_PRODUCTO = {
  pergamino_seco: { label: 'Pergamino seco', emoji: '☕', color: 'bg-amber-50 border-amber-200 text-amber-800' },
  verde: { label: 'Café verde / mojado', emoji: '🌿', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  especial: { label: 'Café especial', emoji: '✨', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  organico: { label: 'Café orgánico', emoji: '🌱', color: 'bg-green-50 border-green-200 text-green-800' },
  pasilla: { label: 'Pasilla', emoji: '🟤', color: 'bg-orange-50 border-orange-200 text-orange-800' },
  cacao: { label: 'Cacao', emoji: '🍫', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
  limon: { label: 'Limón', emoji: '🍋', color: 'bg-lime-50 border-lime-200 text-lime-800' },
};

const esPorKg = (tipo) => ['pasilla', 'cacao', 'limon'].includes(tipo);

function Estrellas({ valor, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button"
          onClick={() => onChange && onChange(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`w-10 h-10 rounded-xl border text-lg transition-all duration-150 ${
            (hover || valor) >= n
              ? 'bg-[#FFF8E7] border-[#C8A96E] text-[#C8A96E]'
              : 'bg-white border-gray-200 text-gray-300'
          } ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}>
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
  const [historialPrecios, setHistorialPrecios] = useState([]);
  const [reseñas, setReseñas] = useState([]);
  const [promedio, setPromedio] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [tagsSeleccionados, setTagsSeleccionados] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [precioAlerta, setPrecioAlerta] = useState('');
  const [alertaGuardada, setAlertaGuardada] = useState(false);
  const [enviandoAlerta, setEnviandoAlerta] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState(null);
  const [modalContacto, setModalContacto] = useState(false);

  const obtenerDatos = useCallback(async () => {
    try {
      const [compradorRes, reseñasRes, preciosRes] = await Promise.all([
        axios.get(`${API_URL}/api/comprador/${id}`),
        axios.get(`${API_URL}/api/resenas/comprador/${id}`),
        axios.get(`${API_URL}/api/precios/comprador/${id}`),
      ]);
      setComprador(compradorRes.data);
      setReseñas(reseñasRes.data.reseñas || []);
      setPromedio(reseñasRes.data.promedio || 0);
      setPrecios(preciosRes.data);
      try {
        const histRes = await axios.get(`${API_URL}/api/historial-precios/comprador/${id}`, {
          withCredentials: true,
        });
        setHistorialPrecios(histRes.data);
      } catch {
        setHistorialPrecios([]);
      }
    } catch (error) {
      console.error('Error al obtener datos:', error);
    } finally {
      setCargando(false);
    }
  }, [API_URL, id]);

  useEffect(() => {
    obtenerDatos();
  }, [obtenerDatos]);

  const toggleTag = (tag) => {
    setTagsSeleccionados((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const handleEnviarReseña = async (e) => {
    e.preventDefault();
    if (calificacion === 0) {
      setMensaje({ tipo: 'error', texto: 'Debes seleccionar una calificacion' });
      setTimeout(() => setMensaje(null), 3000);
      return;
    }
    setEnviando(true);
    try {
      const usuarioId = localStorage.getItem('usuarioId');
      await axios.post(`${API_URL}/api/resenas`, {
        productor: usuarioId,
        comprador: id,
        calificacion,
        comentario,
        tags: tagsSeleccionados,
      }, { withCredentials: true });
      setMensaje({ tipo: 'exito', texto: 'Reseña publicada correctamente' });
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

  const handleActivarAlerta = async () => {
    if (!precioAlerta) return;
    setEnviandoAlerta(true);
    try {
      await axios.post(`${API_URL}/api/alertas`, {
        comprador: id,
        precioMinimo: Number(precioAlerta),
        canales: { push: true, email: false, whatsapp: false },
      }, { withCredentials: true });
      setAlertaGuardada(true);
      setMensajeAlerta({ tipo: 'exito', texto: 'Alerta activada. La veras en tu seccion de alertas.' });
    } catch {
      setMensajeAlerta({ tipo: 'error', texto: 'Error al activar la alerta' });
    } finally {
      setEnviandoAlerta(false);
      setTimeout(() => setMensajeAlerta(null), 3000);
    }
  };

  const iniciales = (nombre) =>
    nombre ? nombre.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase() : '?';

  // Precio principal — pergamino seco o el primero disponible
  const precioActual = precios.find(p => p.tipocafe === 'pergamino_seco') || precios[0];
  const historialFiltrado = historialPrecios.slice(0, 7);
  const maxPrecioHistorial = historialFiltrado.length > 0
    ? Math.max(...historialFiltrado.map((item) => item.preciocarga)) : 1;

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

  const contenido = (
    <div className="min-h-screen bg-[#F7F1E3]">
      <div className="px-4 md:px-8 pt-6">
        <button onClick={() => navigate('/comprador/dashboard')} className="flex items-center gap-2 text-[#8B7355] text-sm mb-4 hover:text-[#2C1A0E] transition-colors">
          <i className="fa-solid fa-arrow-left text-xs"></i> Volver
        </button>
      </div>

      <div className="px-4 md:px-8 pb-8 max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-[#E7D9BF] mb-6 shadow-sm overflow-hidden">
          <div className="h-36 bg-linear-to-r from-[#2C1A0E] via-[#5A2E18] to-[#7A4020] relative">
            <div className="absolute bottom-0 left-6 translate-y-1/2">
              <div className="w-20 h-20 rounded-2xl bg-[#C8A96E] flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                {iniciales(comprador.nombreempresa)}
              </div>
            </div>
          </div>
          <div className="pt-14 px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-[#2C1A0E] text-2xl font-bold">{comprador.nombreempresa}</h1>
                <p className="text-[#8B7355] text-sm mt-1">
                  <i className="fa-solid fa-location-dot mr-1"></i>
                  {comprador.direccion || 'Ubicacion no registrada'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModalContacto(true)}
                  className="flex items-center gap-2 bg-[#C8A96E] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#B8994E] transition-colors">
                  <i className="fa-solid fa-phone text-xs"></i> Contactar
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              <div className="text-center">
                <p className="text-[#C8A96E] text-lg font-bold">
                  {precioActual ? `$${precioActual.preciocarga?.toLocaleString()}` : '---'}
                </p>
                <p className="text-[#8B7355] text-xs">
                  {esPorKg(precioActual?.tipocafe) ? 'COP/kg hoy' : 'COP/carga hoy'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[#2C1A0E] text-lg font-bold">★ {Number(promedio).toFixed(1)}</p>
                <p className="text-[#8B7355] text-xs">{reseñas.length} reseñas</p>
              </div>
              <div className="text-center">
                <p className="text-[#2C1A0E] text-sm font-bold">{precios.length}</p>
                <p className="text-[#8B7355] text-xs">productos</p>
              </div>
              <div className="text-center">
                <p className="text-[#2C1A0E] text-sm font-bold">{comprador.horarioApertura || '08:00'} - {comprador.horarioCierre || '17:00'}</p>
                <p className="text-[#8B7355] text-xs">Horario</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Precio actual */}
            <div className="bg-white rounded-2xl border border-[#E7D9BF] p-5 shadow-sm">
              <h2 className="text-[#2C1A0E] font-bold text-base mb-4">💰 Precio actual</h2>
              <div className="bg-[#2C1A0E] rounded-xl p-4 mb-4">
                <p className="text-[#D8C7A8] text-xs uppercase font-semibold mb-1">
                  PRECIO HOY · {LABELS_PRODUCTO[precioActual?.tipocafe]?.label?.toUpperCase() || precioActual?.tipocafe?.replace(/_/g, ' ').toUpperCase() || 'CAFÉ'}
                </p>
                <p className="text-white text-4xl font-bold">
                  {precioActual ? `$${precioActual.preciocarga?.toLocaleString()}` : '---'}
                </p>
                <p className="text-[#D8C7A8] text-sm mt-1">
                  {esPorKg(precioActual?.tipocafe) ? 'COP por kilogramo' : 'COP por carga de 125 kg'}
                </p>
              </div>
            </div>

            {/* Todos los productos */}
            {precios.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E7D9BF] p-5 shadow-sm">
                <h2 className="text-[#2C1A0E] font-bold text-base mb-4">🛒 Productos que compran</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {precios.map((p, i) => {
                    const info = LABELS_PRODUCTO[p.tipocafe] || { label: p.tipocafe?.replace(/_/g, ' '), emoji: '📦', color: 'bg-gray-50 border-gray-200 text-gray-800' };
                    const porKg = esPorKg(p.tipocafe);
                    return (
                      <div key={i} className={`rounded-xl p-4 border ${info.color}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{info.emoji}</span>
                          <p className="font-semibold text-sm">{info.label}</p>
                        </div>
                        <p className="text-lg font-bold">${p.preciocarga?.toLocaleString()}</p>
                        <p className="text-xs opacity-70 mt-0.5">
                          {porKg ? 'COP por kg' : `COP/carga · $${p.preciokg?.toLocaleString()}/kg`}
                        </p>
                        <p className="text-xs opacity-50 mt-1">
                          Actualizado: {new Date(p.updatedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Historial */}
            {historialFiltrado.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E7D9BF] p-5 shadow-sm">
                <h2 className="text-[#2C1A0E] font-bold text-base mb-4">📈 Historial de precios</h2>
                <div className="space-y-2">
                  {historialFiltrado.map((item, index) => {
                    const barWidth = Math.round((item.preciocarga / maxPrecioHistorial) * 100);
                    const dia = index === 0 ? 'Hoy' : `Hace ${index}d`;
                    return (
                      <div key={item._id || index} className="flex items-center gap-3">
                        <span className="text-[#8B7355] text-xs w-14 shrink-0">{dia}</span>
                        <div className="flex-1 bg-[#F7F1E3] rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full bg-[#C8A96E]" style={{ width: `${barWidth}%` }}></div>
                        </div>
                        <span className="text-[#2C1A0E] text-xs font-semibold w-24 text-right">${item.preciocarga?.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reseñas */}
            <div className="bg-white rounded-2xl border border-[#E7D9BF] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#2C1A0E] font-bold text-base">⭐ Reseñas de caficultores</h2>
                {usuario?.rol === 'productor' && (
                  <button onClick={() => document.getElementById('form-resena')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-[#C8A96E] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#B8994E] transition-colors">
                    + Dejar reseña
                  </button>
                )}
              </div>
              {reseñas.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fa-solid fa-star text-gray-200 text-4xl mb-3"></i>
                  <p className="text-[#8B7355] text-sm">Aun no hay reseñas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reseñas.map((reseña, index) => (
                    <div key={reseña._id || index} className="border-b border-[#E7D9BF] pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[#2C1A0E] text-sm font-semibold">{reseña.productor?.nombre} {reseña.productor?.apellido}</p>
                          <p className="text-[#8B7355] text-xs">{new Date(reseña.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="text-sm">{renderEstrellas(reseña.calificacion)}</div>
                      </div>
                      {reseña.comentario && <p className="text-[#6B5A4D] text-sm mb-2 italic">"{reseña.comentario}"</p>}
                      {reseña.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {reseña.tags.map((tag) => (
                            <span key={tag} className="bg-[#FFF8E7] text-[#7A4020] text-xs px-2.5 py-1 rounded-full border border-[#C8A96E]/30">
                              {TAGS.find((item) => item.value === tag)?.label || tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulario reseña */}
            {usuario?.rol === 'productor' && (
              <div id="form-resena" className="bg-white rounded-2xl border border-[#E7D9BF] p-5 shadow-sm">
                <h2 className="text-[#2C1A0E] font-bold text-base mb-4">✍️ Dejar una reseña</h2>
                {mensaje && (
                  <div className={`px-4 py-3 rounded-xl mb-4 text-sm font-semibold ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {mensaje.texto}
                  </div>
                )}
                <form onSubmit={handleEnviarReseña}>
                  <p className="text-xs font-semibold text-[#8B7355] uppercase mb-2">Calificacion</p>
                  <div className="mb-4"><Estrellas valor={calificacion} onChange={setCalificacion} /></div>
                  <p className="text-xs font-semibold text-[#8B7355] uppercase mb-2">Tags (opcional)</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {TAGS.map((tag) => (
                      <button key={tag.value} type="button" onClick={() => toggleTag(tag.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                          tagsSeleccionados.includes(tag.value)
                            ? 'bg-[#FFF8E7] border-[#C8A96E] text-[#7A4020]'
                            : 'bg-white border-gray-200 text-[#8B7355] hover:border-[#C8A96E]'
                        }`}>
                        {tag.label}
                      </button>
                    ))}
                  </div>
                  <textarea value={comentario} onChange={(e) => setComentario(e.target.value)}
                    placeholder="Escribe tu experiencia con este comprador..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none h-20 focus:outline-none focus:border-[#C8A96E] bg-[#F7F1E3] text-[#2C1A0E] placeholder-gray-400 mb-3" />
                  <button type="submit" disabled={enviando}
                    className="w-full py-3 rounded-xl bg-[#2C1A0E] text-white text-sm font-semibold hover:bg-[#3D1F0F] transition-colors disabled:opacity-60">
                    {enviando ? 'Publicando...' : 'Publicar reseña'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Columna lateral */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#E7D9BF] p-5 shadow-sm">
              <h3 className="text-[#2C1A0E] font-bold text-sm mb-4">📋 Informacion</h3>
              <div className="space-y-3">
                {comprador.direccion && (
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-location-dot text-[#C8A96E] mt-0.5"></i>
                    <div>
                      <p className="text-[#2C1A0E] text-sm">{comprador.direccion}</p>
                      <p className="text-[#8B7355] text-xs">Direccion</p>
                    </div>
                  </div>
                )}
                {comprador.telefono && (
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-phone text-[#C8A96E] mt-0.5"></i>
                    <div>
                      <p className="text-[#2C1A0E] text-sm">{comprador.telefono}</p>
                      <p className="text-[#8B7355] text-xs">Telefono</p>
                    </div>
                  </div>
                )}
                {comprador.horarioApertura && (
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-clock text-[#C8A96E] mt-0.5"></i>
                    <div>
                      <p className="text-[#2C1A0E] text-sm">{comprador.horarioApertura} – {comprador.horarioCierre}</p>
                      <p className="text-[#8B7355] text-xs">Horario</p>
                    </div>
                  </div>
                )}
                {comprador.descripcion && (
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-info-circle text-[#C8A96E] mt-0.5"></i>
                    <div>
                      <p className="text-[#2C1A0E] text-sm">{comprador.descripcion}</p>
                      <p className="text-[#8B7355] text-xs">Descripción</p>
                    </div>
                  </div>
                )}
                {comprador.servicios?.length > 0 && (
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-list text-[#C8A96E] mt-0.5"></i>
                    <div>
                      <p className="text-[#8B7355] text-xs mb-1">Servicios</p>
                      <div className="flex flex-wrap gap-1">
                        {comprador.servicios.map((s, i) => (
                          <span key={i} className="bg-[#F5ECD7] text-[#7A4020] text-xs px-2 py-0.5 rounded-full border border-[#C8A96E]/30">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {usuario && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-green-800 font-bold text-sm mb-1">🔔 Alerta de precio</h3>
                <p className="text-green-700 text-xs mb-3">Avisame cuando este comprador suba su precio</p>
                {mensajeAlerta && (
                  <div className={`px-3 py-2 rounded-xl mb-3 text-xs font-semibold ${mensajeAlerta.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {mensajeAlerta.texto}
                  </div>
                )}
                {alertaGuardada ? (
                  <div className="text-center py-2">
                    <p className="text-green-700 text-sm font-semibold">✅ Alerta activa</p>
                    <p className="text-green-600 text-xs mt-1">Te avisamos cuando supere ${Number(precioAlerta).toLocaleString()}</p>
                  </div>
                ) : (
                  <>
                    <input type="number" placeholder="Ej: 2100000" value={precioAlerta}
                      onChange={(e) => setPrecioAlerta(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-green-200 text-sm focus:outline-none focus:border-green-400 bg-white text-[#2C1A0E] mb-3" />
                    <button onClick={handleActivarAlerta} disabled={!precioAlerta || enviandoAlerta}
                      className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60">
                      {enviandoAlerta ? 'Activando...' : '🔔 Activar alerta'}
                    </button>
                  </>
                )}
              </div>
            )}

            {!usuario && (
              <div className="bg-[#FFF8E7] border border-[#C8A96E]/30 rounded-2xl px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-lock text-[#C8A96E]"></i>
                  <p className="text-[#2C1A0E] text-sm font-semibold">Inicia sesion para dejar una reseña</p>
                </div>
                <Link to="/login" className="bg-[#2C1A0E] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#3D1F0F] transition-colors whitespace-nowrap">
                  Iniciar sesion
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal contacto */}
      {modalContacto && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-80 shadow-xl text-center">
            <div className="w-16 h-16 bg-[#FFF8E7] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-phone text-[#C8A96E] text-2xl"></i>
            </div>
            <h3 className="text-[#2C1A0E] font-bold text-lg mb-1">Contactar comprador</h3>
            <p className="text-[#8B7355] text-sm mb-4">{comprador.nombreempresa}</p>
            <div className="bg-[#F7F1E3] rounded-xl px-6 py-4 mb-6">
              <p className="text-[#2C1A0E] text-2xl font-bold tracking-wide">{comprador.telefono || 'No registrado'}</p>
            </div>
            <button onClick={() => setModalContacto(false)}
              className="w-full bg-[#2C1A0E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return usuario ? (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-16 flex-1">{contenido}</div>
    </div>
  ) : (
    <>
      <Navbar />
      {contenido}
    </>
  );
}
