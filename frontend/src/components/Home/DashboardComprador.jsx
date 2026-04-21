import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import { abrirGuiaKaffi } from '../../utils/kaffiEvents';

function DashboardComprador() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario } = useAuth();
  const [precios, setPrecios] = useState([]);
  const [comprador, setComprador] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setMostrarEliminar] = useState(false);
  const [mostrarHorario, setMostrarHorario] = useState(false);
  const [precioEditar, setPrecioEditar] = useState(null);
  const [precioEliminar, setPrecioEliminar] = useState(null);
  const [nuevoPrecio, setNuevoPrecio] = useState({ preciocarga: '', tipocafe: 'pergamino_seco' });
  const [horarioForm, setHorarioForm] = useState({ horarioApertura: '07:00', horarioCierre: '17:00' });
  const [formPerfil, setFormPerfil] = useState({ nombreempresa: '', direccion: '', telefono: '', horarioApertura: '07:00', horarioCierre: '17:00' });
  const [mensaje, setMensaje] = useState(null);
  const [sinPerfil, setSinPerfil] = useState(false);
  const [reseñas, setReseñas] = useState([]);
  const [promedio, setPromedio] = useState(0);
  const [noticias, setNoticias] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [todosPrecios, setTodosPrecios] = useState([]);
  const [pestana, setPestana] = useState('dashboard');
  const [filtroCafe, setFiltroCafe] = useState('todos');
  const [preciosActivos, setPreciosActivos] = useState({});

  const obtenerPrecios = useCallback(async (compradorId) => {
    try {
      const { data } = await axios.get(`${API_URL}/api/precios/comprador/${compradorId}`);
      setPrecios(data);
      const activos = {};
      data.forEach(p => { activos[p._id] = true; });
      setPreciosActivos(activos);
    } catch (error) {
      console.error('Error al obtener precios:', error);
    } finally {
      setCargando(false);
    }
  }, [API_URL]);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const token = localStorage.getItem('token');
        const usuarioId = usuario?.id;
        if (!usuarioId) { setCargando(false); return; }
        const { data } = await axios.get(
          `${API_URL}/api/comprador/usuario/${usuarioId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setComprador(data);
        setHorarioForm({
          horarioApertura: data.horarioApertura || '07:00',
          horarioCierre: data.horarioCierre || '17:00',
        });
        await obtenerPrecios(data._id);
        const reseñasRes = await axios.get(`${API_URL}/api/resenas/comprador/${data._id}`);
        setReseñas(reseñasRes.data.reseñas || []);
        setPromedio(reseñasRes.data.promedio || 0);
        try {
          const histRes = await axios.get(
            `${API_URL}/api/historial-precios/comprador/${data._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setHistorial(histRes.data);
        } catch { /* opcional */ }
        const mercadoRes = await axios.get(`${API_URL}/api/precios`);
        setTodosPrecios(mercadoRes.data);
        const noticiasRes = await axios.get(`${API_URL}/api/noticias`);
        setNoticias(noticiasRes.data.slice(0, 3));
      } catch (error) {
        if (error.response?.status === 404) setSinPerfil(true);
        setCargando(false);
      }
    };
    obtenerDatos();
  }, [API_URL, usuario?.id, obtenerPrecios]);

  const handleCrearPerfil = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`${API_URL}/api/comprador`, formPerfil, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComprador(data.comprador);
      setSinPerfil(false);
      setHorarioForm({
        horarioApertura: data.comprador.horarioApertura || '07:00',
        horarioCierre: data.comprador.horarioCierre || '17:00',
      });
      await obtenerPrecios(data.comprador._id);
      mostrarMsg('exito', '¡Perfil creado correctamente!');
    } catch (error) {
      mostrarMsg('error', error.response?.data?.message || 'Error al crear el perfil');
    }
  };

  const handlePublicar = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/precios`,
        { ...nuevoPrecio, preciocarga: Number(nuevoPrecio.preciocarga), comprador: comprador._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mostrarMsg('exito', '¡Precio publicado exitosamente!');
      setMostrarFormulario(false);
      setNuevoPrecio({ preciocarga: '', tipocafe: 'pergamino_seco' });
      await obtenerPrecios(comprador._id);
    } catch {
      mostrarMsg('error', 'Error al publicar el precio');
    }
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/precios/${precioEditar._id}`,
        { preciocarga: precioEditar.preciocarga, tipocafe: precioEditar.tipocafe },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mostrarMsg('exito', '¡Precio actualizado exitosamente!');
      setMostrarEditar(false);
      setPrecioEditar(null);
      await obtenerPrecios(comprador._id);
    } catch {
      mostrarMsg('error', 'Error al actualizar el precio');
    }
  };

  const handleEliminar = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/precios/${precioEliminar._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mostrarMsg('exito', 'Precio eliminado correctamente');
      setMostrarEliminar(false);
      setPrecioEliminar(null);
      await obtenerPrecios(comprador._id);
    } catch {
      mostrarMsg('error', 'Error al eliminar el precio');
    }
  };

  const handleDuplicar = async (item) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/precios`,
        { preciocarga: item.preciocarga, tipocafe: item.tipocafe, comprador: comprador._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mostrarMsg('exito', '¡Precio duplicado correctamente!');
      await obtenerPrecios(comprador._id);
    } catch {
      mostrarMsg('error', 'Error al duplicar el precio');
    }
  };

  const handleExportarCSV = () => {
    const headers = ['Tipo de café', 'Precio/carga', 'Precio/kg', 'Fecha'];
    const rows = precios.map(p => [
      p.tipocafe?.replace('_', ' '),
      p.preciocarga,
      p.preciokg,
      new Date(p.createdAt).toLocaleDateString('es-CO')
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `precios_${comprador?.nombreempresa || 'comprador'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarMsg('exito', '¡CSV exportado correctamente!');
  };

  const handleCompartirWhatsApp = () => {
    const precio = precios[0];
    if (!precio) return;
    const texto = `☕ CoffePrice — ${comprador?.nombreempresa} paga hoy\n${precio.preciocarga?.toLocaleString()} COP/carga · ⭐ ${Number(promedio).toFixed(1)}\nVer más: ${window.location.origin}/comprador/${comprador?._id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const handleGuardarHorario = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/comprador/${comprador._id}`, horarioForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComprador({ ...comprador, ...horarioForm });
      mostrarMsg('exito', 'Horario actualizado correctamente');
      setMostrarHorario(false);
    } catch {
      mostrarMsg('error', 'Error al actualizar el horario');
    }
  };

  const mostrarMsg = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3000);
  };

  const precioActual = precios[0]?.preciocarga || 0;
  const preciosOtros = todosPrecios
    .filter(p => p.comprador?._id !== comprador?._id)
    .map(p => p.preciocarga);
  const promercado = preciosOtros.length > 0
    ? Math.round(preciosOtros.reduce((a, b) => a + b, 0) / preciosOtros.length)
    : 0;
  const mejorPrecio = todosPrecios.length > 0
    ? Math.max(...todosPrecios.map(p => p.preciocarga))
    : 0;
  const porEncima = precioActual > promercado;
  const precioSugerido = promercado > 0 ? Math.round(promercado * 1.05) : 0;

  // Posición en el mercado
  const preciosOrdenados = [...todosPrecios].sort((a, b) => b.preciocarga - a.preciocarga);
  const posicion = preciosOrdenados.findIndex(p => p.comprador?._id === comprador?._id) + 1;

  // Tendencia vs precio anterior
  const getTendencia = (item) => {
    const anterior = precios.find(p => p.tipocafe === item.tipocafe && p._id !== item._id);
    if (!anterior) return null;
    const diff = item.preciocarga - anterior.preciocarga;
    const pct = ((diff / anterior.preciocarga) * 100).toFixed(1);
    return { diff, pct };
  };

  const datosGrafica = historial.slice(0, 7).reverse().map((h, idx) => ({
    dia: idx === historial.slice(0, 7).length - 1 ? 'Hoy' : `${idx + 1}d`,
    precio: h.preciocarga,
  }));

  const categoriaEmoji = { mercado: '📈', internacional: '🌎', clima: '🌧️', fnc: '🏛️', produccion: '🌱', consejos: '💡', el_pital: '⛰️' };

  const tipoEmoji = { pergamino_seco: '☕', especial: '✨', organico: '🌿', verde: '🍃' };
  const tipoColor = {
    pergamino_seco: 'bg-amber-50 text-amber-800',
    especial: 'bg-purple-50 text-purple-700',
    organico: 'bg-green-50 text-green-700',
    verde: 'bg-emerald-50 text-emerald-700',
  };

  const preciosFiltrados = filtroCafe === 'todos'
    ? precios
    : precios.filter(p => p.tipocafe === filtroCafe);

  return (
    <div className="min-h-screen bg-[#F5ECD7]">

      {/* Modal sin perfil */}
      {sinPerfil && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#FFF8E7] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-store text-[#C8A96E] text-2xl"></i>
              </div>
              <h3 className="text-[#2C1A0E] font-bold text-xl">Completa tu perfil de empresa</h3>
              <p className="text-gray-400 text-sm mt-2">Necesitas configurar tu empresa para publicar precios</p>
            </div>
            {mensaje && (
              <div className={`px-4 py-3 rounded-xl mb-4 text-sm font-semibold ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
              </div>
            )}
            <form onSubmit={handleCrearPerfil} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Nombre de la empresa</label>
                <input type="text" required value={formPerfil.nombreempresa}
                  onChange={e => setFormPerfil({ ...formPerfil, nombreempresa: e.target.value })}
                  placeholder="Ej: Cooperativa El Huila"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Dirección</label>
                <input type="text" required value={formPerfil.direccion}
                  onChange={e => setFormPerfil({ ...formPerfil, direccion: e.target.value })}
                  placeholder="Ej: Calle 5 #3-20, El Pital, Huila"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Teléfono</label>
                <input type="text" required value={formPerfil.telefono}
                  onChange={e => setFormPerfil({ ...formPerfil, telefono: e.target.value })}
                  placeholder="Ej: 3142233974"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Hora apertura</label>
                  <input type="time" value={formPerfil.horarioApertura}
                    onChange={e => setFormPerfil({ ...formPerfil, horarioApertura: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Hora cierre</label>
                  <input type="time" value={formPerfil.horarioCierre}
                    onChange={e => setFormPerfil({ ...formPerfil, horarioCierre: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
                </div>
              </div>
              <button type="submit"
                className="w-full bg-[#2C1A0E] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors mt-2">
                Crear perfil de empresa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#F5ECD7] px-6 md:px-8 py-5 flex items-center justify-between border-b border-[#E0D0B0] flex-wrap gap-3">
        <div>
          <h1 className="text-[#2C1A0E] text-2xl font-bold">Panel del Comprador</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Bienvenido, <span className="text-[#C8A96E] font-semibold">{usuario?.nombre} {usuario?.apellido}</span>
            {comprador && <span className="text-gray-400"> · {comprador.nombreempresa}</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {comprador && (
            <Link to={`/comprador/${comprador._id}`}
              className="border border-[#2C1A0E] text-[#2C1A0E] px-4 py-2 rounded-full text-xs font-semibold hover:bg-[#2C1A0E] hover:text-white transition-colors flex items-center gap-1.5">
              <i className="fa-solid fa-eye"></i> Ver perfil público
            </Link>
          )}
          <button onClick={() => setMostrarHorario(true)}
            className="border border-[#C8A96E] text-[#C8A96E] px-4 py-2 rounded-full text-xs font-semibold hover:bg-[#C8A96E] hover:text-white transition-colors flex items-center gap-1.5">
            <i className="fa-solid fa-clock"></i>
            {comprador ? `${comprador.horarioApertura || '07:00'} – ${comprador.horarioCierre || '17:00'}` : 'Horario'}
          </button>
          <button onClick={() => setMostrarFormulario(true)}
            className="bg-[#C8A96E] text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-[#B8994E] transition-colors flex items-center gap-1.5">
            <i className="fa-solid fa-plus"></i> Publicar precio
          </button>
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && !sinPerfil && (
        <div className={`mx-6 md:mx-8 mt-4 px-4 py-3 rounded-xl text-sm font-semibold ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
        </div>
      )}

      {/* Pestañas */}
      <div className="px-6 md:px-8 pt-5 flex gap-2 border-b border-[#E0D0B0]">
        {[
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'precios', label: '💰 Mis precios' },
        ].map(p => (
          <button key={p.key} onClick={() => setPestana(p.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-colors -mb-px ${
              pestana === p.key
                ? 'bg-white border border-b-white border-[#E0D0B0] text-[#2C1A0E]'
                : 'text-gray-400 hover:text-[#2C1A0E]'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {pestana === 'dashboard' && (
        <div data-kaffi="dashboard-resumen" className="px-6 md:px-8 py-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#2C1A0E] rounded-2xl p-4 shadow-sm">
              <p className="text-[#D8C7A8] text-xs uppercase font-semibold">Precio actual</p>
              <p className="text-[#F8F2E8] text-2xl font-bold mt-2">{precioActual.toLocaleString() || '---'}</p>
              <p className="text-[#D8C7A8] text-xs mt-1">COP/carga</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E7D9BF]">
              <p className="text-gray-400 text-xs uppercase font-semibold">Reseñas</p>
              <p className="text-[#2C1A0E] text-2xl font-bold mt-2">⭐ {Number(promedio).toFixed(1)}</p>
              <p className="text-gray-400 text-xs mt-1">{reseñas.length} reseñas</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E7D9BF]">
              <p className="text-gray-400 text-xs uppercase font-semibold">Precios publicados</p>
              <p className="text-[#2C1A0E] text-2xl font-bold mt-2">{precios.length}</p>
              <p className="text-gray-400 text-xs mt-1">tipos de café</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E7D9BF]">
              <p className="text-gray-400 text-xs uppercase font-semibold">Posición mercado</p>
              <p className={`text-2xl font-bold mt-2 ${porEncima ? 'text-green-600' : 'text-red-500'}`}>
                {porEncima ? '▲ Arriba' : '▼ Abajo'}
              </p>
              <p className="text-gray-400 text-xs mt-1">vs promedio</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <p className="text-[#2C1A0E] font-bold text-sm mb-4">📈 Evolución de mis precios</p>
              {datosGrafica.length > 1 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={datosGrafica}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1E7D3" />
                      <XAxis dataKey="dia" tick={{ fill: '#8B7355', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#8B7355', fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Precio']} />
                      <Line type="monotone" dataKey="precio" stroke="#C8A96E" strokeWidth={3} dot={{ fill: '#C8A96E', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                  Publica más precios para ver la evolución
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <p className="text-[#2C1A0E] font-bold text-sm mb-4">📊 Vs. mercado hoy</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8B7355]">Mi precio</span>
                    <span className="font-semibold text-[#2C1A0E]">{precioActual.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#F7F1E3] rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-[#2C1A0E]"
                      style={{ width: mejorPrecio > 0 ? `${Math.round((precioActual / mejorPrecio) * 100)}%` : '0%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8B7355]">Promedio mercado</span>
                    <span className="font-semibold text-[#2C1A0E]">{promercado.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#F7F1E3] rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-[#C8A96E]"
                      style={{ width: mejorPrecio > 0 ? `${Math.round((promercado / mejorPrecio) * 100)}%` : '0%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8B7355]">Mejor precio</span>
                    <span className="font-semibold text-[#2C1A0E]">{mejorPrecio.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#F7F1E3] rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-[#E7D9BF]" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
              <div className={`mt-4 rounded-xl p-3 text-center text-xs font-semibold ${porEncima ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {porEncima ? '▲ Tu precio está por encima del promedio' : '▼ Tu precio está por debajo del promedio'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#2C1A0E] font-bold text-sm">⭐ Reseñas recientes</p>
                {comprador && (
                  <Link to={`/comprador/${comprador._id}`} className="text-xs text-[#C8A96E] hover:underline">Ver todas →</Link>
                )}
              </div>
              {reseñas.length === 0 ? (
                <div className="text-center py-6">
                  <i className="fa-solid fa-star text-gray-200 text-3xl mb-2"></i>
                  <p className="text-gray-400 text-sm">Aún no hay reseñas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reseñas.slice(0, 3).map((r, i) => (
                    <div key={i} className={`pb-3 ${i < Math.min(reseñas.length, 3) - 1 ? 'border-b border-[#E7D9BF]' : ''}`}>
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-semibold text-[#2C1A0E]">{r.productor?.nombre} {r.productor?.apellido}</p>
                        <span className="text-[#C8A96E] text-xs">{'★'.repeat(Math.round(r.calificacion))}</span>
                      </div>
                      {r.comentario && <p className="text-xs text-gray-500 italic">"{r.comentario}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#2C1A0E] font-bold text-sm">📰 Últimas noticias</p>
                <Link to="/noticias" className="text-xs text-[#C8A96E] hover:underline">Ver todas →</Link>
              </div>
              {noticias.length === 0 ? (
                <div className="text-center py-6">
                  <i className="fa-solid fa-newspaper text-gray-200 text-3xl mb-2"></i>
                  <p className="text-gray-400 text-sm">No hay noticias recientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {noticias.map((n, i) => (
                    <div key={i} className={`pb-3 ${i < noticias.length - 1 ? 'border-b border-[#E7D9BF]' : ''}`}>
                      <span className="text-xs bg-[#FFF8E7] text-[#C8A96E] px-2 py-0.5 rounded-full font-semibold">
                        {categoriaEmoji[n.categoria]} {n.categoria}
                      </span>
                      <p className="text-sm font-semibold text-[#2C1A0E] mt-1 leading-snug">{n.titulo}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(n.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MIS PRECIOS */}
      {pestana === 'precios' && (
        <div className="px-6 md:px-8 py-6 space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#2C1A0E] rounded-2xl p-4 shadow-sm">
              <p className="text-[#D8C7A8] text-xs uppercase font-semibold">Precios publicados</p>
              <p className="text-[#F8F2E8] text-2xl font-bold mt-2">{precios.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E7D9BF]">
              <p className="text-gray-400 text-xs uppercase font-semibold">Último precio</p>
              <p className="text-[#C8A96E] text-2xl font-bold mt-2">{precios[0]?.preciocarga?.toLocaleString() || '---'}</p>
              {precios.length >= 2 && (
                <p className={`text-xs mt-1 font-semibold ${precios[0]?.preciocarga > precios[1]?.preciocarga ? 'text-green-600' : 'text-red-500'}`}>
                  {precios[0]?.preciocarga > precios[1]?.preciocarga ? '▲' : '▼'} vs anterior
                </p>
              )}
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E7D9BF]">
              <p className="text-gray-400 text-xs uppercase font-semibold">Posición hoy</p>
              <p className="text-[#2C1A0E] text-2xl font-bold mt-2">
                #{posicion > 0 ? posicion : '—'} <span className="text-sm text-gray-400">/ {todosPrecios.length}</span>
              </p>
              {posicion === 1 && <p className="text-xs mt-1 font-semibold text-green-600">🥇 Mejor precio</p>}
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E7D9BF]">
              <p className="text-gray-400 text-xs uppercase font-semibold">Precio sugerido</p>
              <p className="text-[#2C1A0E] text-2xl font-bold mt-2">{precioSugerido.toLocaleString() || '---'}</p>
              <p className="text-gray-400 text-xs mt-1">Basado en mercado</p>
            </div>
          </div>

          {/* Posición en el mercado */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <p className="text-[#2C1A0E] font-bold text-sm">📊 Posición en el mercado hoy</p>
              <div className="flex gap-2">
                {['todos', 'pergamino_seco', 'verde', 'especial', 'organico'].map(f => (
                  <button key={f} onClick={() => setFiltroCafe(f)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      filtroCafe === f ? 'bg-[#2C1A0E] text-white' : 'bg-[#F5ECD7] text-[#8B7355] hover:bg-[#E0D0B0]'
                    }`}>
                    {f === 'todos' ? 'Todos' : f.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {todosPrecios
                .filter(p => filtroCafe === 'todos' || p.tipocafe === filtroCafe)
                .sort((a, b) => b.preciocarga - a.preciocarga)
                .slice(0, 6)
                .map((p, i) => {
                  const esMio = p.comprador?._id === comprador?._id;
                  const pct = mejorPrecio > 0 ? Math.round((p.preciocarga / mejorPrecio) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-20 text-xs text-right shrink-0 font-semibold ${esMio ? 'text-[#2C1A0E]' : 'text-[#8B7355]'}`}>
                        {esMio ? `${p.comprador?.nombreempresa || 'Tú'} ★` : p.comprador?.nombreempresa || '—'}
                      </div>
                      <div className="flex-1 bg-[#F7F1E3] rounded-lg h-6 overflow-hidden">
                        <div
                          className={`h-full rounded-lg flex items-center px-2 transition-all ${esMio ? 'bg-[#2C1A0E]' : 'bg-[#E7D9BF]'}`}
                          style={{ width: `${pct}%` }}>
                          <span className={`text-xs font-semibold ${esMio ? 'text-white' : 'text-[#8B7355]'}`}>
                            {p.preciocarga?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {i === 0 && <span className="text-xs bg-[#FAEEDA] text-[#854F0B] px-2 py-0.5 rounded-full font-semibold shrink-0">Mejor</span>}
                      {esMio && i !== 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold shrink-0">Tú</span>}
                      {!esMio && i !== 0 && <span className="w-12 shrink-0"></span>}
                    </div>
                  );
                })}
            </div>
            <div className="flex justify-between mt-3 text-xs text-[#8B7355]">
              <span>{todosPrecios.length > 0 ? Math.min(...todosPrecios.map(p => p.preciocarga)).toLocaleString() : '---'} mínimo</span>
              <span className={`font-semibold ${porEncima ? 'text-green-600' : 'text-red-500'}`}>
                {porEncima ? '▲ Estás por encima del promedio' : '▼ Estás por debajo del promedio'}
                {promercado > 0 && ` (${porEncima ? '+' : ''}${(precioActual - promercado).toLocaleString()})`}
              </span>
              <span>{mejorPrecio.toLocaleString()} máximo</span>
            </div>
          </div>

          {/* Tabla de precios */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <p className="text-[#2C1A0E] font-bold text-sm">💰 Mis precios publicados</p>
              <div className="flex gap-2">
                <button onClick={handleExportarCSV}
                  className="border border-[#E7D9BF] text-[#8B7355] px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-[#F5ECD7] transition-colors flex items-center gap-1.5">
                  <i className="fa-solid fa-download"></i> Exportar CSV
                </button>
                <button onClick={() => setMostrarFormulario(true)}
                  className="bg-[#C8A96E] text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-[#B8994E] transition-colors flex items-center gap-1.5">
                  <i className="fa-solid fa-plus"></i> Nuevo precio
                </button>
              </div>
            </div>

            {cargando ? (
              <div className="text-center py-12 text-gray-400">Cargando...</div>
            ) : precios.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No hay precios publicados aún</div>
            ) : (
              <div className="space-y-3">
                {preciosFiltrados.map((item, i) => {
                  const tendencia = getTendencia(item);
                  const activo = preciosActivos[item._id] !== false;
                  const historialItem = historial.filter(h => h.tipocafe === item.tipocafe).slice(0, 7).reverse();
                  const maxH = historialItem.length > 0 ? Math.max(...historialItem.map(h => h.preciocarga)) : 1;
                  return (
                    <div key={i} className={`border border-[#E7D9BF] rounded-2xl p-4 transition-all ${!activo ? 'opacity-50' : ''}`}>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${tipoColor[item.tipocafe]?.split(' ')[0] || 'bg-[#F5ECD7]'}`}>
                            {tipoEmoji[item.tipocafe] || '☕'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#2C1A0E] capitalize">{item.tipocafe?.replace('_', ' ')}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(item.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="text-center">
                            <p className="text-base font-bold text-[#2C1A0E]">{item.preciocarga?.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">COP/carga</p>
                          </div>
                          <div className="text-center">
                            <p className="text-base font-bold text-[#2C1A0E]">{item.preciokg?.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">COP/kg</p>
                          </div>
                          {tendencia && (
                            <div className="text-center">
                              <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${tendencia.diff >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                {tendencia.diff >= 0 ? '▲' : '▼'} {Math.abs(tendencia.pct)}%
                              </span>
                              <p className="text-xs text-gray-400 mt-0.5">vs anterior</p>
                            </div>
                          )}
                          {/* Toggle activo/inactivo */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{activo ? 'Activo' : 'Inactivo'}</span>
                            <button
                              onClick={() => setPreciosActivos(prev => ({ ...prev, [item._id]: !prev[item._id] }))}
                              className={`relative w-10 h-5 rounded-full transition-colors ${activo ? 'bg-[#C8A96E]' : 'bg-gray-200'}`}>
                              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${activo ? 'left-5' : 'left-0.5'}`}></span>
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setPrecioEditar(item); setMostrarEditar(true); }}
                              className="bg-[#F5ECD7] text-[#2C1A0E] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#E0D0B0] transition-colors">
                              <i className="fa-solid fa-pen"></i>
                            </button>
                            <button onClick={() => handleDuplicar(item)}
                              className="bg-[#F5ECD7] text-[#2C1A0E] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#E0D0B0] transition-colors" title="Duplicar">
                              <i className="fa-solid fa-copy"></i>
                            </button>
                            <button onClick={() => { setPrecioEliminar(item); setMostrarEliminar(true); }}
                              className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors">
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* Mini historial */}
                      {historialItem.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-[#F7F1E3]">
                          <p className="text-xs text-gray-400 mb-2">Últimas {historialItem.length} actualizaciones</p>
                          <div className="flex items-end gap-1 h-8">
                            {historialItem.map((h, j) => {
                              const height = Math.round((h.preciocarga / maxH) * 32);
                              const esHoy = j === historialItem.length - 1;
                              return (
                                <div key={j} className="flex-1 rounded-t-sm transition-all"
                                  style={{ height: `${height}px`, background: esHoy ? '#2C1A0E' : '#C8A96E', opacity: esHoy ? 1 : 0.6 }}></div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Precio sugerido + Acciones rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#FFF8E7] border border-[#C8A96E]/50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">💡</span>
                <p className="text-[#2C1A0E] font-bold text-sm">Precio sugerido para hoy</p>
              </div>
              <p className="text-[#C8A96E] text-2xl font-bold mb-1">{precioSugerido.toLocaleString()} COP</p>
              <p className="text-[#8B7355] text-xs mb-4">
                Subir tu precio podría atraerte más caficultores sin salir del rango competitivo del mercado.
              </p>
              <button onClick={() => {
                setNuevoPrecio({ ...nuevoPrecio, preciocarga: precioSugerido.toString() });
                setMostrarFormulario(true);
              }}
                className="w-full bg-[#C8A96E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#B8994E] transition-colors">
                Aplicar precio sugerido
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <p className="text-[#2C1A0E] font-bold text-sm mb-4">⚡ Acciones rápidas</p>
              <button
                onClick={() => abrirGuiaKaffi('dashboard_comprador')}
                className="mb-3 w-full rounded-xl border border-[#C8A96E] bg-[#FFF8EC] px-4 py-2.5 text-left text-xs font-semibold text-[#3D1F0F] transition hover:bg-[#F5ECD7]"
              >
                Que Kaffi me haga un recorrido de este panel
              </button>
              <div data-kaffi="dashboard-acciones" className="space-y-2">
                <button data-kaffi="dashboard-publicar" onClick={() => setMostrarFormulario(true)}
                  className="w-full bg-[#2C1A0E] text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-[#3D1F0F] transition-colors text-left px-4 flex items-center gap-2">
                  <i className="fa-solid fa-plus"></i> Publicar nuevo precio del día
                </button>
                <button onClick={() => precios[0] && handleDuplicar(precios[0])}
                  className="w-full bg-[#F5ECD7] text-[#2C1A0E] py-2.5 rounded-xl text-xs font-semibold hover:bg-[#E0D0B0] transition-colors text-left px-4 flex items-center gap-2">
                  <i className="fa-solid fa-copy"></i> Duplicar último precio publicado
                </button>
                <button onClick={handleExportarCSV}
                  className="w-full bg-[#F5ECD7] text-[#2C1A0E] py-2.5 rounded-xl text-xs font-semibold hover:bg-[#E0D0B0] transition-colors text-left px-4 flex items-center gap-2">
                  <i className="fa-solid fa-download"></i> Exportar historial completo CSV
                </button>
                <button onClick={handleCompartirWhatsApp}
                  className="w-full bg-[#F5ECD7] text-[#2C1A0E] py-2.5 rounded-xl text-xs font-semibold hover:bg-[#E0D0B0] transition-colors text-left px-4 flex items-center gap-2">
                  <i className="fa-brands fa-whatsapp text-green-600"></i> Compartir mi precio por WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal publicar precio */}
      {mostrarFormulario && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-96 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#2C1A0E] font-bold text-lg">Publicar precio del día</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => abrirGuiaKaffi('publicar_precio')}
                  className="rounded-full border border-[#C8A96E] px-3 py-1 text-[11px] font-semibold text-[#3D1F0F] transition hover:bg-[#FFF8EC]"
                >
                  Guia de Kaffi
                </button>
                <button onClick={() => setMostrarFormulario(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>
            </div>
            <form onSubmit={handlePublicar}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Precio por carga (COP)</label>
                <input data-kaffi="precio-carga" type="number" placeholder="Ej: 1950000" required value={nuevoPrecio.preciocarga}
                  onChange={(e) => setNuevoPrecio({ ...nuevoPrecio, preciocarga: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Tipo de café</label>
                <select data-kaffi="precio-tipo" value={nuevoPrecio.tipocafe}
                  onChange={(e) => setNuevoPrecio({ ...nuevoPrecio, tipocafe: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]">
                  <option value="pergamino_seco">Pergamino seco</option>
                  <option value="especial">Café especial</option>
                  <option value="organico">Orgánico</option>
                  <option value="verde">Verde</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setMostrarFormulario(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button data-kaffi="precio-submit" type="submit"
                  className="flex-1 bg-[#C8A96E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#B8994E] transition-colors">
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar precio */}
      {mostrarEditar && precioEditar && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-96 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#2C1A0E] font-bold text-lg">Editar precio</h3>
              <button onClick={() => setMostrarEditar(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleEditar}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Precio por carga (COP)</label>
                <input type="number" required value={precioEditar.preciocarga}
                  onChange={(e) => setPrecioEditar({ ...precioEditar, preciocarga: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Tipo de café</label>
                <select value={precioEditar.tipocafe}
                  onChange={(e) => setPrecioEditar({ ...precioEditar, tipocafe: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]">
                  <option value="pergamino_seco">Pergamino seco</option>
                  <option value="especial">Café especial</option>
                  <option value="organico">Orgánico</option>
                  <option value="verde">Verde</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setMostrarEditar(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-[#C8A96E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#B8994E] transition-colors">
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal eliminar precio */}
      {mostrarEliminar && precioEliminar && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-80 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-trash text-red-500 text-2xl"></i>
            </div>
            <h3 className="text-[#2C1A0E] font-bold text-lg mb-2">¿Eliminar precio?</h3>
            <p className="text-gray-400 text-sm mb-1">Vas a eliminar el precio de</p>
            <p className="text-[#2C1A0E] font-bold text-base mb-1">{precioEliminar.preciocarga?.toLocaleString()} COP/carga</p>
            <p className="text-gray-400 text-xs mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => { setMostrarEliminar(false); setPrecioEliminar(null); }}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleEliminar}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal horario */}
      {mostrarHorario && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-96 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#2C1A0E] font-bold text-lg">Configurar horario</h3>
              <button onClick={() => setMostrarHorario(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleGuardarHorario}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Hora de apertura</label>
                <input type="time" value={horarioForm.horarioApertura}
                  onChange={e => setHorarioForm({ ...horarioForm, horarioApertura: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Hora de cierre</label>
                <input type="time" value={horarioForm.horarioCierre}
                  onChange={e => setHorarioForm({ ...horarioForm, horarioCierre: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
              </div>
              <p className="text-xs text-gray-400 mb-4 text-center">
                Horario actual: {horarioForm.horarioApertura} – {horarioForm.horarioCierre}
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setMostrarHorario(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-[#2C1A0E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardComprador;
