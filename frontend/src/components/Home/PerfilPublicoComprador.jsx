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
  { value: 'bascula_justa', label: 'Báscula justa' },
];

const TIPOS_CAFE = [
  { value: 'pergamino_seco', label: 'Pergamino seco', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'especial', label: 'Especial / Fino', color: 'bg-green-50 text-green-800 border-green-200' },
  { value: 'organico', label: 'Orgánico', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  { value: 'verde', label: 'Café verde', color: 'bg-sky-50 text-sky-800 border-sky-200' },
];

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function Estrellas({ valor, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(n => (
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
  const [periodoHistorial, setPeriodoHistorial] = useState('7D');
  const [numCargas, setNumCargas] = useState(1);
  const [numKg, setNumKg] = useState(50);
  const [modoCalculo, setModoCalculo] = useState('cargas');
  const [precioAlerta, setPrecioAlerta] = useState('');
  const [alertaGuardada, setAlertaGuardada] = useState(false);
  const [enviandoAlerta, setEnviandoAlerta] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState(null);
  const [modalContacto, setModalContacto] = useState(false);

const obtenerDatos = useCallback(async () => {
  try {
    const token = localStorage.getItem('token');
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
        const histRes = await axios.get(
          `${API_URL}/api/historial-precios/comprador/${id}`,
          { withCredentials: true }
        );
        setHistorialPrecios(histRes.data);
      } catch { /* historial opcional */ }
    } catch (error) {
      console.error('Error al obtener datos:', error);
    } finally {
      setCargando(false);
    }
  }, [id, API_URL]);

  useEffect(() => {
    obtenerDatos();
  }, [obtenerDatos]);

  const handleComoLlegar = () => {
    if (!comprador?.latitud || !comprador?.longitud) {
      alert('Este comprador aún no ha configurado su ubicación en el mapa.');
      return;
    }
    setModalMapa(true);
    setBuscandoUbicacion(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMiUbicacion([pos.coords.latitude, pos.coords.longitude]);
          setBuscandoUbicacion(false);
        },
        () => {
          setBuscandoUbicacion(false);
        }
      );
      setHistorialPrecios(histRes.data);
    } catch { /* historial opcional */ }
  } catch (error) {
    console.error('Error al obtener datos:', error);
  } finally {
    setCargando(false);
  }
}, [id, API_URL]); // ← Dependencias correctas

useEffect(() => {
  obtenerDatos();
}, [obtenerDatos]); // ← Dependencia correcta

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
      const usuarioId = localStorage.getItem('usuarioId');
      await axios.post(`${API_URL}/api/resenas`, {
        productor: usuarioId,
        comprador: id,
        calificacion,
        comentario,
        tags: tagsSeleccionados,
      }, { withCredentials: true });
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
      setMensajeAlerta({ tipo: 'exito', texto: '¡Alerta activada! Aparece en tu sección de alertas.' });
    } catch {
      setMensajeAlerta({ tipo: 'error', texto: 'Error al activar la alerta' });
    } finally {
      setEnviandoAlerta(false);
      setTimeout(() => setMensajeAlerta(null), 3000);
    }
  };

  const iniciales = (nombre) =>
    nombre ? nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  const precioActual = precios[0];
  const precioHoy = historialPrecios[0]?.preciocarga;
  const precioAyer = historialPrecios[1]?.preciocarga;
  const variacion = precioHoy && precioAyer ? precioHoy - precioAyer : null;
  const variacionPct = variacion && precioAyer ? ((variacion / precioAyer) * 100).toFixed(1) : null;

  const diasFiltro = periodoHistorial === '7D' ? 7 : 30;
  const historialFiltrado = historialPrecios.slice(0, diasFiltro);
  const maxPrecioHistorial = historialFiltrado.length > 0
    ? Math.max(...historialFiltrado.map(h => h.preciocarga)) : 1;

  const distribucion = [5, 4, 3, 2, 1].map(n => ({
    estrellas: n,
    cantidad: reseñas.filter(r => Math.round(r.calificacion) === n).length,
    porcentaje: reseñas.length > 0
      ? Math.round((reseñas.filter(r => Math.round(r.calificacion) === n).length / reseñas.length) * 100) : 0,
  }));

  const estaAbierto = () => {
    if (!comprador?.horarioApertura || !comprador?.horarioCierre) return true;
    const ahora = new Date();
    const [hAp, mAp] = comprador.horarioApertura.split(':').map(Number);
    const [hCi, mCi] = comprador.horarioCierre.split(':').map(Number);
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
    const minutosApertura = hAp * 60 + mAp;
    const minutosCierre = hCi * 60 + mCi;
    return minutosAhora >= minutosApertura && minutosAhora < minutosCierre;
  };
  const abierto = estaAbierto();

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
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#8B7355] text-sm mb-4 hover:text-[#2C1A0E] transition-colors">
          <i className="fa-solid fa-arrow-left text-xs"></i> Volver
        </button>
      </div>

      <div className="px-4 md:px-8 pb-8 max-w-6xl mx-auto">

        {/* Header con banner */}
        <div className="bg-white rounded-2xl border border-[#E7D9BF] mb-6 shadow-sm overflow-hidden">
          <div className="h-36 bg-gradient-to-r from-[#2C1A0E] via-[#5A2E18] to-[#7A4020] relative">
            <div className="absolute bottom-0 left-6 translate-y-1/2">
              <div className="w-20 h-20 rounded-2xl bg-[#C8A96E] flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                {iniciales(comprador.nombreempresa)}
              </div>
            </div>
          </div>
          <div className="pt-14 px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[#2C1A0E] text-2xl font-bold">{comprador.nombreempresa}</h1>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">✓ Verificado</span>
                </div>
                <p className="text-[#8B7355] text-sm mt-1">
                  <i className="fa-solid fa-location-dot mr-1"></i>
                  {comprador.direccion || 'Pitalito, Huila'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModalContacto(true)}
                  className="flex items-center gap-2 bg-[#C8A96E] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#B8994E] transition-colors">
                  <i className="fa-solid fa-phone text-xs"></i> Contactar
                </button>
                <button className="flex items-center gap-2 border border-[#E7D9BF] text-[#2C1A0E] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#F7F1E3] transition-colors">
                  <i className="fa-solid fa-map text-xs"></i> Cómo llegar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
              <div className="text-center">
                <p className="text-[#C8A96E] text-lg font-bold">
                  {precioActual ? precioActual.preciocarga?.toLocaleString() : '---'}
                </p>
                <p className="text-[#8B7355] text-xs">COP/carga hoy</p>
              </div>
              <div className="text-center">
                <p className="text-[#2C1A0E] text-lg font-bold">⭐ {Number(promedio).toFixed(1)}</p>
                <p className="text-[#8B7355] text-xs">{reseñas.length} reseñas</p>
              </div>
              <div className="text-center">
                <p className="text-[#2C1A0E] text-sm font-bold">{precioActual?.preciokg?.toLocaleString() || '---'}</p>
                <p className="text-[#8B7355] text-xs">COP/kg</p>
              </div>
              <div className="text-center">
                <p className="text-[#2C1A0E] text-sm font-bold">{DIAS[new Date().getDay()]}</p>
                <p className="text-[#8B7355] text-xs">
                  {comprador.horarioApertura || '08:00'} – {comprador.horarioCierre || '17:00'}
                </p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${abierto ? 'text-green-600' : 'text-red-500'}`}>
                  {abierto ? 'Abierto' : 'Cerrado'}
                </p>
                <p className="text-[#8B7355] text-xs">Estado actual</p>
              </div>
            </div>
          </div>
        </div>

        {/* Layout dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">

            {/* Precio actual */}
            <div className="bg-white rounded-2xl border border-[#E7D9BF] p-5 shadow-sm">
              <h2 className="text-[#2C1A0E] font-bold text-base mb-4">💰 Precio actual</h2>
              <div className="bg-[#2C1A0E] rounded-xl p-4 mb-4">
                <p className="text-[#D8C7A8] text-xs uppercase font-semibold mb-1">
                  PRECIO HOY · {precioActual?.tipocafe?.replace('_', ' ').toUpperCase() || 'CAFÉ'}
                </p>
                <p className="text-white text-4xl font-bold">
                  {precioActual ? precioActual.preciocarga?.toLocaleString() : '---'}
                </p>
                <p className="text-[#D8C7A8] text-sm mt-1">COP por carga de 125 kg</p>
                {variacion !== null && (
                  <div className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    variacion >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {variacion >= 0 ? '▲' : '▼'} {variacionPct}% vs ayer · {variacion >= 0 ? '+' : ''}{variacion?.toLocaleString()}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F7F1E3] rounded-xl p-3 text-center">
                  <p className="text-[#2C1A0E] text-lg font-bold">{precioActual?.preciokg?.toLocaleString() || '---'}</p>
                  <p className="text-[#8B7355] text-xs">COP por kilogramo</p>
                </div>
                <div className="bg-[#F7F1E3] rounded-xl p-3 text-center">
                  <p className="text-[#2C1A0E] text-lg font-bold">
                    ${precioActual ? (precioActual.preciocarga * numCargas)?.toLocaleString() : '---'}
                  </p>
                  <p className="text-[#8B7355] text-xs">Si vendes {numCargas} carga{numCargas > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Historial */}
            {historialFiltrado.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E7D9BF] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[#2C1A0E] font-bold text-base">📈 Historial de precios</h2>
                  <div className="flex gap-1">
                    {['7D', '30D'].map(p => (
                      <button key={p} onClick={() => setPeriodoHistorial(p)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          periodoHistorial === p ? 'bg-[#C8A96E] text-white' : 'bg-[#F7F1E3] text-[#8B7355] hover:bg-[#E7D9BF]'
                        }`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {historialFiltrado.map((h, i) => {
                    const anterior = historialFiltrado[i + 1];
                    const diff = anterior ? h.preciocarga - anterior.preciocarga : null;
                    const pct = diff && anterior ? ((diff / anterior.preciocarga) * 100).toFixed(1) : null;
                    const barWidth = Math.round((h.preciocarga / maxPrecioHistorial) * 100);
                    const diasAtras = i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : `Hace ${i}d`;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[#8B7355] text-xs w-14 shrink-0">{diasAtras}</span>
                        <div className="flex-1 bg-[#F7F1E3] rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full bg-[#C8A96E]" style={{ width: `${barWidth}%` }}></div>
                        </div>
                        <span className="text-[#2C1A0E] text-xs font-semibold w-24 text-right">{h.preciocarga?.toLocaleString()}</span>
                        {pct !== null ? (
                          <span className={`text-xs font-semibold w-14 text-right ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {diff >= 0 ? '▲' : '▼'} {Math.abs(pct)}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 w-14 text-right">— 0%</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tipos de café */}
            <div className="bg-white rounded-2xl border border-[#E7D9BF] p-5 shadow-sm">
              <h2 className="text-[#2C1A0E] font-bold text-base mb-4">☕ Tipos de café que compran</h2>
              <div className="grid grid-cols-2 gap-3">
                {TIPOS_CAFE.map((tipo, i) => {
                  const precioTipo = precios.find(p => p.tipocafe === tipo.value);
                  return (
                    <div key={i} className={`rounded-xl p-4 border ${tipo.color}`}>
                      <p className="font-semibold text-sm">{tipo.label}</p>
                      {precioTipo ? (
                        <p className="text-xs mt-1 font-bold">{precioTipo.preciocarga?.toLocaleString()} COP/carga</p>
                      ) : (
                        <p className="text-xs mt-1 opacity-60">No disponible</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reseñas */}
            <div className="bg-white rounded-2xl border border-[#E7D9BF] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#2C1A0E] font-bold text-base">⭐ Reseñas de caficultores</h2>
                {usuario?.rol === 'productor' && (
                  <button onClick={() => document.getElementById('form-resena').scrollIntoView({ behavior: 'smooth' })}
                    className="bg-[#C8A96E] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#B8994E] transition-colors">
                    + Dejar reseña
                  </button>
                )}
              </div>
              {reseñas.length > 0 && (
                <div className="flex gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-[#2C1A0E]">{Number(promedio).toFixed(1)}</p>
                    <div className="text-lg mt-1">{renderEstrellas(promedio)}</div>
                    <p className="text-[#8B7355] text-xs mt-1">{reseñas.length} reseñas</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {distribucion.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-[#8B7355] w-3">{d.estrellas}</span>
                        <div className="flex-1 bg-[#F7F1E3] rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full bg-[#C8A96E]" style={{ width: `${d.porcentaje}%` }}></div>
                        </div>
                        <span className="text-xs text-[#8B7355] w-6 text-right">{d.cantidad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {reseñas.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fa-solid fa-star text-gray-200 text-4xl mb-3"></i>
                  <p className="text-[#8B7355] text-sm">Aún no hay reseñas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reseñas.map((r, i) => (
                    <div key={i} className="border-b border-[#E7D9BF] pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#C8A96E] flex items-center justify-center text-white text-xs font-bold">
                            {iniciales(`${r.productor?.nombre} ${r.productor?.apellido}`)}
                          </div>
                          <div>
                            <p className="text-[#2C1A0E] text-sm font-semibold">{r.productor?.nombre} {r.productor?.apellido}</p>
                            <p className="text-[#8B7355] text-xs">
                              {new Date(r.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm">{renderEstrellas(r.calificacion)}</div>
                      </div>
                      {r.comentario && <p className="text-[#6B5A4D] text-sm mb-2 italic">"{r.comentario}"</p>}
                      {r.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {r.tags.map((tag, j) => (
                            <span key={j} className="bg-[#FFF8E7] text-[#7A4020] text-xs px-2.5 py-1 rounded-full border border-[#C8A96E]/30">
                              ✅ {TAGS.find(t => t.value === tag)?.label || tag}
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
                <h2 className="text-[#2C1A0E] font-bold text-base mb-4">
                  <i className="fa-solid fa-star text-[#C8A96E] mr-2"></i>Dejar una reseña
                </h2>
                {mensaje && (
                  <div className={`px-4 py-3 rounded-xl mb-4 text-sm font-semibold ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
                  </div>
                )}
                <form onSubmit={handleEnviarReseña}>
                  <p className="text-xs font-semibold text-[#8B7355] uppercase mb-2">Calificación</p>
                  <div className="mb-4"><Estrellas valor={calificacion} onChange={setCalificacion} /></div>
                  <p className="text-xs font-semibold text-[#8B7355] uppercase mb-2">Tags (opcional)</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {TAGS.map(tag => (
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
                  <p className="text-xs font-semibold text-[#8B7355] uppercase mb-2">Comentario (opcional)</p>
                  <textarea value={comentario} onChange={e => setComentario(e.target.value)}
                    placeholder="Escribe tu experiencia con este comprador..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none h-20 focus:outline-none focus:border-[#C8A96E] bg-[#F7F1E3] text-[#2C1A0E] placeholder-gray-400 mb-3" />
                  <button type="submit" disabled={enviando}
                    className="w-full py-3 rounded-xl bg-[#2C1A0E] text-white text-sm font-semibold hover:bg-[#3D1F0F] transition-colors disabled:opacity-60">
                    {enviando ? 'Publicando...' : 'Publicar reseña'}
                  </button>
                </form>
              </div>
            )}

            {!usuario && (
              <div className="bg-[#FFF8E7] border border-[#C8A96E]/30 rounded-2xl px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-lock text-[#C8A96E]"></i>
                  <p className="text-[#2C1A0E] text-sm font-semibold">Inicia sesión para dejar una reseña</p>
                </div>
                <Link to="/login" className="bg-[#2C1A0E] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#3D1F0F] transition-colors whitespace-nowrap">
                  Iniciar sesión
                </Link>
              </div>
            )}
          </div>

          {/* Columna lateral */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#E7D9BF] p-5 shadow-sm">
              <h3 className="text-[#2C1A0E] font-bold text-sm mb-4">📋 Información</h3>
              <div className="space-y-3">
                {comprador.direccion && (
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-location-dot text-[#C8A96E] mt-0.5"></i>
                    <div>
                      <p className="text-[#2C1A0E] text-sm">{comprador.direccion}</p>
                      <p className="text-[#8B7355] text-xs">Dirección</p>
                    </div>
                  </div>
                )}
                {comprador.telefono && (
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-phone text-[#C8A96E] mt-0.5"></i>
                    <div>
                      <p className="text-[#2C1A0E] text-sm">{comprador.telefono}</p>
                      <p className="text-[#8B7355] text-xs">Teléfono</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-clock text-[#C8A96E] mt-0.5"></i>
                  <div>
                    <p className="text-[#2C1A0E] text-sm">
                      {comprador.horarioApertura || '08:00'} – {comprador.horarioCierre || '17:00'}
                    </p>
                    <p className="text-[#8B7355] text-xs">Horario de compra</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i className={`fa-solid fa-circle text-xs mt-1 ${abierto ? 'text-green-500' : 'text-red-400'}`}></i>
                  <div>
                    <p className={`text-sm font-semibold ${abierto ? 'text-green-600' : 'text-red-500'}`}>
                      {abierto ? 'Abierto ahora' : 'Cerrado ahora'}
                    </p>
                    <p className="text-[#8B7355] text-xs">Estado actual</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E7D9BF] p-5 shadow-sm">
              <h3 className="text-[#2C1A0E] font-bold text-sm mb-1">🧮 ¿Cuánto recibirías?</h3>
              <p className="text-[#8B7355] text-xs mb-3">Calcula tu ganancia vendiendo aquí hoy</p>
              <div className="flex gap-2 mb-4">
                <button onClick={() => setModoCalculo('cargas')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${modoCalculo === 'cargas' ? 'bg-[#2C1A0E] text-white' : 'bg-[#F7F1E3] text-[#8B7355]'}`}>
                  Por cargas
                </button>
                <button onClick={() => setModoCalculo('kg')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${modoCalculo === 'kg' ? 'bg-[#2C1A0E] text-white' : 'bg-[#F7F1E3] text-[#8B7355]'}`}>
                  Por kilos
                </button>
              </div>
              {modoCalculo === 'cargas' ? (
                <>
                  <label className="text-xs font-semibold text-[#8B7355] uppercase mb-2 block">Número de cargas</label>
                  <input type="number" min="1" value={numCargas}
                    onChange={e => setNumCargas(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-3 rounded-xl border border-[#E7D9BF] text-sm focus:outline-none focus:border-[#C8A96E] bg-[#F7F1E3] text-[#2C1A0E] mb-3" />
                </>
              ) : (
                <>
                  <label className="text-xs font-semibold text-[#8B7355] uppercase mb-2 block">Kilogramos</label>
                  <input type="number" min="1" value={numKg}
                    onChange={e => setNumKg(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-3 rounded-xl border border-[#E7D9BF] text-sm focus:outline-none focus:border-[#C8A96E] bg-[#F7F1E3] text-[#2C1A0E] mb-3" />
                </>
              )}
              {precioActual && (
                <div className="bg-[#2C1A0E] rounded-xl p-4 text-center">
                  <p className="text-[#D8C7A8] text-xs mb-1">Recibirías</p>
                  <p className="text-white text-2xl font-bold">
                    ${modoCalculo === 'cargas'
                      ? (precioActual.preciocarga * numCargas)?.toLocaleString()
                      : (precioActual.preciokg * numKg)?.toLocaleString()}
                  </p>
                  <p className="text-[#D8C7A8] text-xs mt-1">
                    {modoCalculo === 'cargas'
                      ? `${numCargas} carga${numCargas > 1 ? 's' : ''} × ${precioActual.preciocarga?.toLocaleString()}`
                      : `${numKg} kg × ${precioActual.preciokg?.toLocaleString()}/kg`}
                  </p>
                </div>
              )}
            </div>

            {usuario && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-green-800 font-bold text-sm mb-1">🔔 Alerta de precio</h3>
                <p className="text-green-700 text-xs mb-3">Avísame cuando este comprador suba su precio</p>
                {mensajeAlerta && (
                  <div className={`px-3 py-2 rounded-xl mb-3 text-xs font-semibold ${mensajeAlerta.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {mensajeAlerta.tipo === 'exito' ? '✅' : '❌'} {mensajeAlerta.texto}
                  </div>
                )}
                {alertaGuardada ? (
                  <div className="text-center py-2">
                    <p className="text-green-700 text-sm font-semibold">✅ Alerta activa</p>
                    <p className="text-green-600 text-xs mt-1">
                      Te avisamos cuando supere ${Number(precioAlerta).toLocaleString()}
                    </p>
                    <button onClick={() => { setAlertaGuardada(false); setPrecioAlerta(''); }}
                      className="mt-3 text-xs text-green-600 hover:underline">
                      Cambiar precio
                    </button>
                  </div>
                ) : (
                  <>
                    <label className="text-xs font-semibold text-green-700 uppercase mb-2 block">Precio mínimo de alerta</label>
                    <input type="number" placeholder="Ej: 2100000" value={precioAlerta}
                      onChange={e => setPrecioAlerta(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-green-200 text-sm focus:outline-none focus:border-green-400 bg-white text-[#2C1A0E] mb-3" />
                    <button onClick={handleActivarAlerta} disabled={!precioAlerta || enviandoAlerta}
                      className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60">
                      {enviandoAlerta ? 'Activando...' : '🔔 Activar alerta'}
                    </button>
                  </>
                )}
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
              <p className="text-[#2C1A0E] text-2xl font-bold tracking-wide">
                {comprador.telefono || 'No registrado'}
              </p>
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
        <>
          <Navbar />
          {contenido}
        </>
      )}
    </>
  );
}


