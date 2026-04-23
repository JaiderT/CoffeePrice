import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

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
  const [resenas, setResenas] = useState([]);
  const [promedio, setPromedio] = useState(0);
  const [noticias, setNoticias] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [todosPrecios, setTodosPrecios] = useState([]);
  const [pestana, setPestana] = useState('dashboard');

  // âœ… useCallback para evitar recreaciÃ³n innecesaria
  const obtenerPrecios = useCallback(async (compradorId) => {
    try {
      const { data } = await axios.get(`${API_URL}/api/precios/comprador/${compradorId}`);
      setPrecios(data);
    } catch (error) {
      console.error('Error al obtener precios:', error);
    } finally {
      setCargando(false);
    }
  }, [API_URL]);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const usuarioId = usuario?.id;
        if (!usuarioId) { setCargando(false); return; }

        const { data } = await axios.get(
          `${API_URL}/api/comprador/usuario/${usuarioId}`,
          { withCredentials: true }
        );
        setComprador(data);
        setHorarioForm({
          horarioApertura: data.horarioApertura || '07:00',
          horarioCierre: data.horarioCierre || '17:00',
        });
        await obtenerPrecios(data._id);

        // ReseÃ±as
        const resenasRes = await axios.get(`${API_URL}/api/resenas/comprador/${data._id}`);
        setResenas(resenasRes.data.reseñas || []);
        setPromedio(resenasRes.data.promedio || 0);

        // Historial de precios
        try {
          const histRes = await axios.get(
            `${API_URL}/api/historial-precios/comprador/${data._id}`,
            { withCredentials: true }
          );
          setHistorial(histRes.data);
        } catch { /* opcional */ }

        // Todos los precios del mercado para comparativa
        const mercadoRes = await axios.get(`${API_URL}/api/precios`);
        setTodosPrecios(mercadoRes.data);

        // Noticias recientes
        const noticiasRes = await axios.get(`${API_URL}/api/noticias`);
        setNoticias(noticiasRes.data.slice(0, 3));

      } catch (error) {
        if (error.response?.status === 404) {
          setSinPerfil(true);
        }
        setCargando(false);
      }
    };
    obtenerDatos();
  }, [API_URL, usuario?.id, obtenerPrecios]);

  const handleCrearPerfil = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_URL}/api/comprador`, formPerfil, { withCredentials: true });
      setComprador(data.comprador);
      setSinPerfil(false);
      setHorarioForm({
        horarioApertura: data.comprador.horarioApertura || '07:00',
        horarioCierre: data.comprador.horarioCierre || '17:00',
      });
      await obtenerPrecios(data.comprador._id);
      mostrarMsg('exito', 'Â¡Perfil creado correctamente!');
    } catch (error) {
      mostrarMsg('error', error.response?.data?.message || 'Error al crear el perfil');
    }
  };

  const handlePublicar = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/precios`,
        { ...nuevoPrecio, preciocarga: Number(nuevoPrecio.preciocarga), comprador: comprador._id },
        { withCredentials: true }
      );
      mostrarMsg('exito', 'Â¡Precio publicado exitosamente!');
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
      await axios.put(`${API_URL}/api/precios/${precioEditar._id}`,
        { preciocarga: precioEditar.preciocarga, tipocafe: precioEditar.tipocafe },
        { withCredentials: true }
      );
      mostrarMsg('exito', 'Â¡Precio actualizado exitosamente!');
      setMostrarEditar(false);
      setPrecioEditar(null);
      await obtenerPrecios(comprador._id);
    } catch {
      mostrarMsg('error', 'Error al actualizar el precio');
    }
  };

  const handleEliminar = async () => {
    try {
      await axios.delete(`${API_URL}/api/precios/${precioEliminar._id}`,
        { withCredentials: true }
      );
      mostrarMsg('exito', 'Precio eliminado correctamente');
      setMostrarEliminar(false);
      setPrecioEliminar(null);
      await obtenerPrecios(comprador._id);
    } catch {
      mostrarMsg('error', 'Error al eliminar el precio');
    }
  };

  const handleGuardarHorario = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/comprador/${comprador._id}`, horarioForm, { withCredentials: true });
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

  // Calcular comparativa vs mercado
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

  // Datos grÃ¡fica historial
  const datosGrafica = historial.slice(0, 7).reverse().map((h, i) => ({
    dia: i === historial.slice(0, 7).length - 1 ? 'Hoy' : `${i + 1}d`,
    precio: h.preciocarga,
  }));

  const categoriaEmoji = { mercado: 'ðŸ“ˆ', internacional: 'ðŸŒŽ', clima: 'ðŸŒ§ï¸', fnc: 'ðŸ›ï¸', produccion: 'ðŸŒ±', consejos: 'ðŸ’¡', el_pital: 'â›°ï¸' };

  return (
    <div className="min-h-screen bg-[#F5ECD7]">
      {/* Pantalla sin perfil - IGUAL QUE ANTES */}
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
                {mensaje.tipo === 'exito' ? 'âœ…' : 'âŒ'} {mensaje.texto}
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
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">DirecciÃ³n</label>
                <input type="text" required value={formPerfil.direccion}
                  onChange={e => setFormPerfil({ ...formPerfil, direccion: e.target.value })}
                  placeholder="Ej: Calle 5 #3-20, El Pital, Huila"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">TelÃ©fono</label>
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
            {comprador && <span className="text-gray-400"> Â· {comprador.nombreempresa}</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {comprador && (
            <Link to={`/comprador/${comprador._id}`}
              className="border border-[#2C1A0E] text-[#2C1A0E] px-4 py-2 rounded-full text-xs font-semibold hover:bg-[#2C1A0E] hover:text-white transition-colors flex items-center gap-1.5">
              <i className="fa-solid fa-eye"></i> Ver perfil pÃºblico
            </Link>
          )}
          <button onClick={() => setMostrarHorario(true)}
            className="border border-[#C8A96E] text-[#C8A96E] px-4 py-2 rounded-full text-xs font-semibold hover:bg-[#C8A96E] hover:text-white transition-colors flex items-center gap-1.5">
            <i className="fa-solid fa-clock"></i>
            {comprador ? `${comprador.horarioApertura || '07:00'} â€“ ${comprador.horarioCierre || '17:00'}` : 'Horario'}
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
          {mensaje.tipo === 'exito' ? 'âœ…' : 'âŒ'} {mensaje.texto}
        </div>
      )}

      {/* PestaÃ±as */}
      <div className="px-6 md:px-8 pt-5 flex gap-2 border-b border-[#E0D0B0]">
        {[
          { key: 'dashboard', label: 'ðŸ“Š Dashboard' },
          { key: 'precios', label: 'ðŸ’° Mis precios' },
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

      {/* PESTAÃ‘A DASHBOARD */}
      {pestana === 'dashboard' && (
        <div className="px-6 md:px-8 py-6 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#2C1A0E] rounded-2xl p-4 shadow-sm">
              <p className="text-[#D8C7A8] text-xs uppercase font-semibold">Precio actual</p>
              <p className="text-[#F8F2E8] text-2xl font-bold mt-2">{precioActual.toLocaleString() || '---'}</p>
              <p className="text-[#D8C7A8] text-xs mt-1">COP/carga</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E7D9BF]">
              <p className="text-gray-400 text-xs uppercase font-semibold">ReseÃ±as</p>
              <p className="text-[#2C1A0E] text-2xl font-bold mt-2">â­ {Number(promedio).toFixed(1)}</p>
              <p className="text-gray-400 text-xs mt-1">{resenas.length} reseÃ±as</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E7D9BF]">
              <p className="text-gray-400 text-xs uppercase font-semibold">Precios publicados</p>
              <p className="text-[#2C1A0E] text-2xl font-bold mt-2">{precios.length}</p>
              <p className="text-gray-400 text-xs mt-1">tipos de cafÃ©</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E7D9BF]">
              <p className="text-gray-400 text-xs uppercase font-semibold">PosiciÃ³n mercado</p>
              <p className={`text-2xl font-bold mt-2 ${porEncima ? 'text-green-600' : 'text-red-500'}`}>
                {porEncima ? 'â–² Arriba' : 'â–¼ Abajo'}
              </p>
              <p className="text-gray-400 text-xs mt-1">vs promedio</p>
            </div>
          </div>

          {/* GrÃ¡fica + Comparativa */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* GrÃ¡fica historial */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <p className="text-[#2C1A0E] font-bold text-sm mb-4">ðŸ“ˆ EvoluciÃ³n de mis precios</p>
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
                  Publica mÃ¡s precios para ver la evoluciÃ³n
                </div>
              )}
            </div>

            {/* Comparativa mercado */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <p className="text-[#2C1A0E] font-bold text-sm mb-4">ðŸ“Š Vs. mercado hoy</p>
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
              <div className={`mt-4 rounded-xl p-3 text-center text-xs font-semibold ${
                porEncima ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
              }`}>
                {porEncima
                  ? 'â–² Tu precio estÃ¡ por encima del promedio'
                  : 'â–¼ Tu precio estÃ¡ por debajo del promedio'}
              </div>
            </div>
          </div>

          {/* ReseÃ±as + Noticias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* ReseÃ±as recientes */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#2C1A0E] font-bold text-sm">â­ ReseÃ±as recientes</p>
                {comprador && (
                  <Link to="/noticias" className="text-xs text-[#C8A96E] hover:underline">Ver todas â†’</Link>
                )}
              </div>
              {resenas.length === 0 ? (
                <div className="text-center py-6">
                  <i className="fa-solid fa-star text-gray-200 text-3xl mb-2"></i>
                  <p className="text-gray-400 text-sm">AÃºn no hay reseÃ±as</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resenas.slice(0, 3).map((r, i) => (
                    <div key={i} className={`pb-3 ${i < Math.min(resenas.length, 3) - 1 ? 'border-b border-[#E7D9BF]' : ''}`}>
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-semibold text-[#2C1A0E]">
                          {r.productor?.nombre} {r.productor?.apellido}
                        </p>
                        <span className="text-[#C8A96E] text-xs">{'â˜…'.repeat(Math.round(r.calificacion))}</span>
                      </div>
                      {r.comentario && <p className="text-xs text-gray-500 italic">"{r.comentario}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Noticias recientes */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#2C1A0E] font-bold text-sm">ðŸ“° Ãšltimas noticias</p>
                <a href="/noticias" className="text-xs text-[#C8A96E] hover:underline">Ver todas â†’</a>
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

      {/* PESTAÃ‘A MIS PRECIOS */}
      {pestana === 'precios' && (
        <div className="px-6 md:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <p className="text-gray-400 text-xs uppercase font-semibold">Precios publicados</p>
              <p className="text-[#2C1A0E] text-3xl font-bold mt-1">{precios.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <p className="text-gray-400 text-xs uppercase font-semibold">Ãšltimo precio</p>
              <p className="text-[#C8A96E] text-3xl font-bold mt-1">
                {precios[0]?.preciocarga?.toLocaleString() || '---'}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <p className="text-gray-400 text-xs uppercase font-semibold">Precio por kilo</p>
              <p className="text-[#2C1A0E] text-3xl font-bold mt-1">
                {precios[0]?.preciokg?.toLocaleString() || '---'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-[#2C1A0E] rounded-xl text-xs text-gray-400 font-semibold uppercase mb-3">
            <div>Tipo de cafÃ©</div>
            <div>Precio/carga</div>
            <div>Precio/kg</div>
            <div>Fecha</div>
            <div>Acciones</div>
          </div>

          {cargando ? (
            <div className="text-center py-12 text-gray-400">Cargando...</div>
          ) : precios.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No hay precios publicados aÃºn</div>
          ) : (
            precios.map((item, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 px-4 py-4 bg-white rounded-xl mb-3 items-center hover:shadow-md transition-shadow border border-[#E7D9BF]">
                <div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    item.tipocafe === 'especial' ? 'bg-purple-100 text-purple-700' :
                    item.tipocafe === 'organico' ? 'bg-green-100 text-green-700' :
                    item.tipocafe === 'verde' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-amber-100 text-amber-700'}`}>
                    {item.tipocafe?.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-[#2C1A0E]">{item.preciocarga?.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">COP/carga</p>
                </div>
                <div>
                  <p className="font-semibold text-[#2C1A0E]">{item.preciokg?.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">COP/kg</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">
                    {new Date(item.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setPrecioEditar(item); setMostrarEditar(true); }}
                    className="bg-[#F5ECD7] text-[#2C1A0E] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#E0D0B0] transition-colors">
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button onClick={() => { setPrecioEliminar(item); setMostrarEliminar(true); }}
                    className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal publicar precio */}
      {mostrarFormulario && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-96 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#2C1A0E] font-bold text-lg">Publicar precio del dÃ­a</h3>
              <button onClick={() => setMostrarFormulario(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <form onSubmit={handlePublicar}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Precio por carga (COP)</label>
                <input type="number" placeholder="Ej: 1950000" required value={nuevoPrecio.preciocarga}
                  onChange={(e) => setNuevoPrecio({ ...nuevoPrecio, preciocarga: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Tipo de cafÃ©</label>
                <select value={nuevoPrecio.tipocafe}
                  onChange={(e) => setNuevoPrecio({ ...nuevoPrecio, tipocafe: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]">
                  <option value="pergamino_seco">Pergamino seco</option>
                  <option value="especial">CafÃ© especial</option>
                  <option value="organico">OrgÃ¡nico</option>
                  <option value="verde">Verde</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setMostrarFormulario(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
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
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Tipo de cafÃ©</label>
                <select value={precioEditar.tipocafe}
                  onChange={(e) => setPrecioEditar({ ...precioEditar, tipocafe: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]">
                  <option value="pergamino_seco">Pergamino seco</option>
                  <option value="especial">CafÃ© especial</option>
                  <option value="organico">OrgÃ¡nico</option>
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
            <h3 className="text-[#2C1A0E] font-bold text-lg mb-2">Â¿Eliminar precio?</h3>
            <p className="text-gray-400 text-sm mb-1">Vas a eliminar el precio de</p>
            <p className="text-[#2C1A0E] font-bold text-base mb-1">{precioEliminar.preciocarga?.toLocaleString()} COP/carga</p>
            <p className="text-gray-400 text-xs mb-6">Esta acciÃ³n no se puede deshacer.</p>
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
                Horario actual: {horarioForm.horarioApertura} â€“ {horarioForm.horarioCierre}
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
