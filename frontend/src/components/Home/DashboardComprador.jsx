import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

const TIPOS_PRODUCTO = [
  { value: 'pergamino_seco', label: '☕ Pergamino seco', unidad: 'carga', grupo: 'Café' },
  { value: 'verde', label: '🌿 Café verde / mojado', unidad: 'carga', grupo: 'Café' },
  { value: 'especial', label: '✨ Café especial', unidad: 'carga', grupo: 'Café' },
  { value: 'organico', label: '🌱 Café orgánico', unidad: 'carga', grupo: 'Café' },
  { value: 'pasilla', label: '🟤 Pasilla', unidad: 'kg', grupo: 'Café' },
  { value: 'cacao', label: '🍫 Cacao', unidad: 'kg', grupo: 'Otros' },
  { value: 'limon', label: '🍋 Limón', unidad: 'kg', grupo: 'Otros' },
];

const BADGE_COLORS = {
  pergamino_seco: 'bg-amber-100 text-amber-700',
  verde: 'bg-emerald-100 text-emerald-700',
  especial: 'bg-purple-100 text-purple-700',
  organico: 'bg-green-100 text-green-700',
  pasilla: 'bg-orange-100 text-orange-700',
  cacao: 'bg-yellow-100 text-yellow-700',
  limon: 'bg-lime-100 text-lime-700',
};

const esPorKg = (tipo) => ['pasilla', 'cacao', 'limon'].includes(tipo);

const TIPOS_EMPRESA = [
  { value: 'cooperativa', label: 'Cooperativa' },
  { value: 'trilladora', label: 'Trilladora' },
  { value: 'independiente', label: 'Independiente' },
  { value: 'exportadora', label: 'Exportadora' },
  { value: 'otro', label: 'Otro' },
];

const MUNICIPIOS = [
  'El Pital',
  'Pitalito',
  'Acevedo',
  'La Argentina',
  'Tarqui',
  'Suaza',
  'Palestina',
  'Elías',
  'Saladoblanco',
  'Isnos',
];

const SERVICIOS_OPCIONES = [
  'Café pergamino seco',
  'Café especial',
  'Café orgánico',
  'Café verde',
  'Pasilla',
  'Cacao',
  'Maíz',
  'Fique',
  'Otros productos agrícolas',
];

const ESTADO_REVISION_UI = {
  perfilIncompleto: {
    label: 'Perfil incompleto',
    badge: 'bg-gray-100 text-gray-600',
    panel: 'border-gray-200 bg-gray-50 text-gray-600',
    hint: 'Completa más datos de tu empresa para que tu perfil se vea más confiable.',
  },
  enRevision: {
    label: 'En revisión',
    badge: 'bg-amber-100 text-amber-700',
    panel: 'border-amber-200 bg-amber-50 text-amber-700',
    hint: 'Tu empresa está siendo revisada por el administrador.',
  },
  aprobado: {
    label: 'Aprobado',
    badge: 'bg-green-100 text-green-700',
    panel: 'border-green-200 bg-green-50 text-green-700',
    hint: 'Tu perfil está activo y visible para productores.',
  },
  rechazado: {
    label: 'Requiere cambios',
    badge: 'bg-red-100 text-red-700',
    panel: 'border-red-200 bg-red-50 text-red-700',
    hint: 'Revisa las observaciones del administrador y ajusta tu perfil.',
  },
};

// ✅ Configuración global de axios para siempre enviar cookies
const api = axios.create({ withCredentials: true });

function DashboardComprador() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario } = useAuth();

  const [precios, setPrecios] = useState([]);
  const [comprador, setComprador] = useState(null);
  // ✅ Ref para siempre tener el valor más reciente de comprador en los handlers
  const compradorRef = useRef(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setMostrarEliminar] = useState(false);
  const [mostrarHorario, setMostrarHorario] = useState(false);
  const [precioEditar, setPrecioEditar] = useState(null);
  const [precioEliminar, setPrecioEliminar] = useState(null);
  const [nuevoPrecio, setNuevoPrecio] = useState({ preciocarga: '', tipocafe: 'pergamino_seco' });
  const [horarioForm, setHorarioForm] = useState({ horarioApertura: '07:00', horarioCierre: '17:00' });
  const [formPerfil, setFormPerfil] = useState({
    nombreempresa: '',
    tipoempresa: 'independiente',
    municipio: 'El Pital',
    direccion: '',
    telefono: '',
    horarioApertura: '07:00',
    horarioCierre: '17:00',
    descripcion: '',
    servicios: [],
  });
  const [mensaje, setMensaje] = useState(null);
  const [publicandoPrecio, setPublicandoPrecio] = useState(false);
  const [sinPerfil, setSinPerfil] = useState(false);
  const [resenas, setResenas] = useState([]);
  const [promedio, setPromedio] = useState(0);
  const [noticias, setNoticias] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [todosPrecios, setTodosPrecios] = useState([]);
  const [pestana, setPestana] = useState('dashboard');

  // ✅ Helper para actualizar comprador en estado y ref a la vez
  const actualizarComprador = (data) => {
    compradorRef.current = data;
    setComprador(data);
  };

  const obtenerPrecios = useCallback(async (compradorId) => {
    try {
      // ✅ Ruta pública, no necesita credenciales
      const { data } = await axios.get(`${API_URL}/api/precios/comprador/${compradorId}`);
      setPrecios(data);
    } catch (error) {
      console.error('Error al obtener precios:', error);
    } finally {
      setCargando(false);
    }
  }, [API_URL]);

  const refrescarMercado = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/precios`, {
        params: { t: Date.now() },
      });
      setTodosPrecios(data);
    } catch (error) {
      console.error('Error al refrescar precios del mercado:', error);
    }
  }, [API_URL]);

  const refrescarHistorial = useCallback(async (compradorId) => {
    if (!compradorId) return;
    try {
      const { data } = await api.get(`${API_URL}/api/historial-precios/comprador/${compradorId}`, {
        params: { t: Date.now() },
      });
      setHistorial(data);
    } catch {
      // opcional
    }
  }, [API_URL]);

  useEffect(() => {
    // ✅ Esperar a que el contexto tenga el usuario listo
    if (!usuario?.id) return;

    const obtenerDatos = async () => {
      try {
        // ✅ Usando 'api' (instancia con withCredentials) en rutas protegidas
        const { data } = await api.get(`${API_URL}/api/comprador/usuario/${usuario.id}`);

        // ✅ Usar actualizarComprador para sincronizar ref y estado
        actualizarComprador(data);
        setHorarioForm({
          horarioApertura: data.horarioApertura || '07:00',
          horarioCierre: data.horarioCierre || '17:00',
        });
        setFormPerfil({
          nombreempresa: data.nombreempresa || '',
          tipoempresa: data.tipoempresa || 'independiente',
          municipio: data.municipio || 'El Pital',
          direccion: data.direccion || '',
          telefono: data.telefono || '',
          horarioApertura: data.horarioApertura || '07:00',
          horarioCierre: data.horarioCierre || '17:00',
          descripcion: data.descripcion || '',
          servicios: Array.isArray(data.servicios) ? data.servicios : [],
        });

        await obtenerPrecios(data._id);

        // ✅ Ruta pública
        const resenasRes = await axios.get(`${API_URL}/api/resenas/comprador/${data._id}`);
        setResenas(resenasRes.data.reseñas || []);
        setPromedio(resenasRes.data.promedio || 0);

        try {
          // ✅ Ruta protegida
          const histRes = await api.get(`${API_URL}/api/historial-precios/comprador/${data._id}`);
          setHistorial(histRes.data);
        } catch { /* opcional */ }

        // ✅ Rutas públicas
        await refrescarMercado();

        const noticiasRes = await axios.get(`${API_URL}/api/noticias`);
        setNoticias(noticiasRes.data.slice(0, 3));

      } catch (error) {
        if (error.response?.status === 404) setSinPerfil(true);
        else console.error('Error al obtener datos:', error.response?.status, error.response?.data);
        setCargando(false);
      }
    };

    obtenerDatos();
  }, [API_URL, usuario?.id, obtenerPrecios, refrescarMercado]);

  const handleCrearPerfil = async (e) => {
    e.preventDefault();
    try {
      // ✅ Ruta protegida
      const { data } = await api.post(`${API_URL}/api/comprador`, formPerfil);
      // ✅ Usar actualizarComprador para sincronizar ref y estado
      actualizarComprador(data.comprador);
      setFormPerfil({
        nombreempresa: data.comprador.nombreempresa || '',
        tipoempresa: data.comprador.tipoempresa || 'independiente',
        municipio: data.comprador.municipio || 'El Pital',
        direccion: data.comprador.direccion || '',
        telefono: data.comprador.telefono || '',
        horarioApertura: data.comprador.horarioApertura || '07:00',
        horarioCierre: data.comprador.horarioCierre || '17:00',
        descripcion: data.comprador.descripcion || '',
        servicios: Array.isArray(data.comprador.servicios) ? data.comprador.servicios : [],
      });
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
    if (publicandoPrecio) return;

    // ✅ Leer siempre desde el ref para evitar el closure stale
    const compradorActual = compradorRef.current;
    if (!compradorActual?._id) {
      mostrarMsg('error', 'Espera a que se cargue tu perfil de empresa');
      return;
    }

    setPublicandoPrecio(true);
    try {
      // ✅ Ruta protegida
      await api.post(`${API_URL}/api/precios`, {
        ...nuevoPrecio,
        preciocarga: Number(nuevoPrecio.preciocarga),
        comprador: compradorActual._id,
      });
      mostrarMsg('exito', '¡Precio publicado exitosamente!');
      setMostrarFormulario(false);
      setNuevoPrecio({ preciocarga: '', tipocafe: 'pergamino_seco' });
      await obtenerPrecios(compradorActual._id);
      await refrescarMercado();
      await refrescarHistorial(compradorActual._id);
    } catch (error) {
      mostrarMsg('error', error.response?.data?.message || 'Error al publicar el precio');
    } finally {
      setPublicandoPrecio(false);
    }
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    try {
      // ✅ Ruta protegida
      await api.put(`${API_URL}/api/precios/${precioEditar._id}`, {
        preciocarga: Number(precioEditar.preciocarga),
        tipocafe: precioEditar.tipocafe,
      });
      mostrarMsg('exito', '¡Precio actualizado exitosamente!');
      setMostrarEditar(false);
      setPrecioEditar(null);
      await obtenerPrecios(compradorRef.current._id);
      await refrescarMercado();
      await refrescarHistorial(compradorRef.current._id);
    } catch (error) {
      mostrarMsg('error', error.response?.data?.message || 'Error al actualizar el precio');
    }
  };

  const handleEliminar = async () => {
    try {
      // ✅ Ruta protegida
      await api.delete(`${API_URL}/api/precios/${precioEliminar._id}`);
      mostrarMsg('exito', 'Precio eliminado correctamente');
      setMostrarEliminar(false);
      setPrecioEliminar(null);
      await obtenerPrecios(compradorRef.current._id);
      await refrescarMercado();
      await refrescarHistorial(compradorRef.current._id);
    } catch {
      mostrarMsg('error', 'Error al eliminar el precio');
    }
  };

  const handleGuardarHorario = async (e) => {
    e.preventDefault();
    try {
      // ✅ Ruta protegida
      await api.put(`${API_URL}/api/comprador/${compradorRef.current._id}`, horarioForm);
      // ✅ Usar actualizarComprador para sincronizar ref y estado
      actualizarComprador({ ...compradorRef.current, ...horarioForm });
      mostrarMsg('exito', 'Horario actualizado correctamente');
      setMostrarHorario(false);
    } catch {
      mostrarMsg('error', 'Error al actualizar el horario');
    }
  };

  const toggleServicio = (servicio) => {
    setFormPerfil((prev) => ({
      ...prev,
      servicios: prev.servicios.includes(servicio)
        ? prev.servicios.filter((item) => item !== servicio)
        : [...prev.servicios, servicio],
    }));
  };

  const mostrarMsg = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3000);
  };

  const precioActual = precios.find(p => p.tipocafe === 'pergamino_seco')?.preciocarga || precios[0]?.preciocarga || 0;
  const preciosOtros = todosPrecios.filter(p => p.comprador?._id !== comprador?._id).map(p => p.preciocarga);
  const promercado = preciosOtros.length > 0
    ? Math.round(preciosOtros.reduce((a, b) => a + b, 0) / preciosOtros.length) : 0;
  const mejorPrecio = todosPrecios.length > 0 ? Math.max(...todosPrecios.map(p => p.preciocarga)) : 0;
  const porEncima = precioActual > promercado;

  const datosGrafica = historial.slice(0, 7).reverse().map((h, i) => ({
    dia: i === historial.slice(0, 7).length - 1 ? 'Hoy' : `${i + 1}d`,
    precio: h.preciocarga,
  }));

  const estadoRevision = ESTADO_REVISION_UI[comprador?.estadoRevision] || ESTADO_REVISION_UI.perfilIncompleto;
  const perfilCompletoScore = [
    comprador?.nombreempresa,
    comprador?.direccion,
    comprador?.telefono,
    comprador?.municipio,
    comprador?.descripcion,
    comprador?.servicios?.length > 0,
  ].filter(Boolean).length;
  const perfilCompletoPct = Math.round((perfilCompletoScore / 6) * 100);

  const categoriaEmoji = { mercado: '📈', internacional: '🌎', clima: '🌧️', fnc: '🏛️', produccion: '🌱', consejos: '💡', el_pital: '⛰️' };
  const cardBase = 'rounded-[22px] border border-[#E7D9BF] bg-white shadow-[0_10px_30px_rgba(77,48,24,0.06)]';
  const metricCard = `${cardBase} p-4`;
  const sectionTitle = 'text-[#2C1A0E] font-bold tracking-tight';

  const SelectProducto = ({ value, onChange }) => (
    <select value={value} onChange={onChange}
      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]">
      <optgroup label="☕ Café">
        {TIPOS_PRODUCTO.filter(t => t.grupo === 'Café').map(t => (
          <option key={t.value} value={t.value}>{t.label} (por {t.unidad})</option>
        ))}
      </optgroup>
      <optgroup label="🌾 Otros productos">
        {TIPOS_PRODUCTO.filter(t => t.grupo === 'Otros').map(t => (
          <option key={t.value} value={t.value}>{t.label} (por {t.unidad})</option>
        ))}
      </optgroup>
    </select>
  );

  return (
    <div className="min-h-screen bg-[#F5ECD7]">

      {/* Sin perfil */}
      {sinPerfil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-[#E7D9BF] bg-white p-5 shadow-[0_24px_60px_rgba(44,26,14,0.20)] md:p-8">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Nombre de la empresa</label>
                  <input type="text" required value={formPerfil.nombreempresa}
                    onChange={e => setFormPerfil({ ...formPerfil, nombreempresa: e.target.value })}
                    placeholder="Ej: Cooperativa El Huila"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E] focus:ring-2 focus:ring-[#E8D3B0]/40" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Tipo de empresa</label>
                  <select
                    value={formPerfil.tipoempresa}
                    onChange={e => setFormPerfil({ ...formPerfil, tipoempresa: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E] focus:ring-2 focus:ring-[#E8D3B0]/40"
                  >
                    {TIPOS_EMPRESA.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Municipio</label>
                  <select
                    value={formPerfil.municipio}
                    onChange={e => setFormPerfil({ ...formPerfil, municipio: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E] focus:ring-2 focus:ring-[#E8D3B0]/40"
                  >
                    {MUNICIPIOS.map((municipio) => (
                      <option key={municipio} value={municipio}>{municipio}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Dirección</label>
                  <input type="text" required value={formPerfil.direccion}
                    onChange={e => setFormPerfil({ ...formPerfil, direccion: e.target.value })}
                    placeholder="Ej: Calle 5 #3-20, El Pital, Huila"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E] focus:ring-2 focus:ring-[#E8D3B0]/40" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Teléfono</label>
                  <input type="text" required value={formPerfil.telefono}
                    onChange={e => setFormPerfil({ ...formPerfil, telefono: e.target.value })}
                    placeholder="Ej: 3142233974"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E] focus:ring-2 focus:ring-[#E8D3B0]/40" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Descripción breve</label>
                  <input type="text" value={formPerfil.descripcion}
                    onChange={e => setFormPerfil({ ...formPerfil, descripcion: e.target.value })}
                    placeholder="Ej: Compra café pergamino y especial"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E] focus:ring-2 focus:ring-[#E8D3B0]/40" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Hora apertura</label>
                  <input type="time" value={formPerfil.horarioApertura}
                    onChange={e => setFormPerfil({ ...formPerfil, horarioApertura: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E] focus:ring-2 focus:ring-[#E8D3B0]/40" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Hora cierre</label>
                  <input type="time" value={formPerfil.horarioCierre}
                    onChange={e => setFormPerfil({ ...formPerfil, horarioCierre: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E] focus:ring-2 focus:ring-[#E8D3B0]/40" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Servicios o productos que compras</label>
                <div className="flex flex-wrap gap-2 rounded-2xl border border-[#E7D9BF] bg-[#FCF8F1] p-3">
                  {SERVICIOS_OPCIONES.map((servicio) => (
                    <button
                      key={servicio}
                      type="button"
                      onClick={() => toggleServicio(servicio)}
                      className={`px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${
                        formPerfil.servicios.includes(servicio)
                          ? 'border-[#C8A96E] bg-[#FFF3DE] text-[#7A4020]'
                          : 'border-[#E0D0B0] bg-white text-[#8B7355] hover:border-[#C8A96E]'
                      }`}
                    >
                      {servicio}
                    </button>
                  ))}
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
      <div className="bg-[#F5ECD7] px-5 md:px-8 py-5 md:py-6 flex items-center justify-between border-b border-[#E0D0B0] flex-wrap gap-3">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A67C43]">
            Resumen del negocio
          </p>
          <h1 className="text-[#2C1A0E] text-2xl md:text-[2rem] font-black tracking-tight">Panel del Comprador</h1>
          <p className="text-gray-500 text-sm mt-1">
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
            disabled={!comprador}
            className="bg-[#C8A96E] text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-[#B8994E] transition-colors flex items-center gap-1.5
            disabled:opacity-50 disabled:cursor-not-allowed">
            <i className="fa-solid fa-plus"></i> Publicar precio
          </button>
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && !sinPerfil && (
        <div className={`mx-5 md:mx-8 mt-4 px-4 py-3 rounded-2xl border text-sm font-semibold shadow-sm ${mensaje.tipo === 'exito' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
        </div>
      )}

      {/* Pestañas */}
      <div className="px-5 md:px-8 pt-5 flex gap-2 border-b border-[#E0D0B0]">
        {[
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'precios', label: '💰 Mis precios' },
        ].map(p => (
          <button key={p.key} onClick={() => setPestana(p.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-colors -mb-px ${
              pestana === p.key
                ? 'bg-white border border-b-white border-[#E0D0B0] text-[#2C1A0E] shadow-sm'
                : 'text-gray-400 hover:text-[#2C1A0E]'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* PESTAÑA DASHBOARD */}
      {pestana === 'dashboard' && (
        <div className="px-5 md:px-8 py-5 md:py-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`lg:col-span-2 ${cardBase} p-5`}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className={`${sectionTitle} text-sm`}>🏢 Estado de mi empresa</p>
                  <p className="text-xs text-gray-500 mt-1">Así ve el sistema tu perfil comercial hoy.</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoRevision.badge}`}>
                  {estadoRevision.label}
                </span>
              </div>
              <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${estadoRevision.panel}`}>
                {estadoRevision.hint}
                {comprador?.motivoRevision && (
                  <p className="mt-2 text-xs font-semibold">{comprador.motivoRevision}</p>
                )}
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[#8B7355]">Perfil empresarial completo</span>
                  <span className="font-semibold text-[#2C1A0E]">{perfilCompletoPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#F3E6D4] overflow-hidden">
                  <div className="h-full rounded-full bg-linear-to-r from-[#C8A96E] to-[#2C1A0E]" style={{ width: `${perfilCompletoPct}%` }} />
                </div>
              </div>
              <div className="mt-4 grid sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-2xl bg-[#FCF8F1] border border-[#E7D9BF] p-3">
                  <p className="text-[#8B7355] mb-1">Tipo</p>
                  <p className="font-semibold text-[#2C1A0E]">{TIPOS_EMPRESA.find((item) => item.value === comprador?.tipoempresa)?.label || 'Sin definir'}</p>
                </div>
                <div className="rounded-2xl bg-[#FCF8F1] border border-[#E7D9BF] p-3">
                  <p className="text-[#8B7355] mb-1">Municipio</p>
                  <p className="font-semibold text-[#2C1A0E]">{comprador?.municipio || 'Sin definir'}</p>
                </div>
                <div className="rounded-2xl bg-[#FCF8F1] border border-[#E7D9BF] p-3">
                  <p className="text-[#8B7355] mb-1">Servicios</p>
                  <p className="font-semibold text-[#2C1A0E]">{comprador?.servicios?.length || 0} registrados</p>
                </div>
              </div>
            </div>

            <div className={`${cardBase} p-5`}>
              <p className={`${sectionTitle} text-sm mb-4`}>⚡ Acciones del rol</p>
              <div className="space-y-3">
                <Link to="/comprador/perfil" className="flex items-center justify-between rounded-2xl border border-[#E7D9BF] bg-[#FCF8F1] px-4 py-3 text-sm font-semibold text-[#2C1A0E] transition-colors hover:bg-[#FFF3DE]">
                  Completar perfil empresarial
                  <i className="fa-solid fa-chevron-right text-xs text-[#A67C43]"></i>
                </Link>
                <button onClick={() => setMostrarFormulario(true)} className="flex w-full items-center justify-between rounded-2xl border border-[#E7D9BF] bg-[#FCF8F1] px-4 py-3 text-sm font-semibold text-[#2C1A0E] transition-colors hover:bg-[#FFF3DE]">
                  Publicar nuevo precio
                  <i className="fa-solid fa-tag text-xs text-[#A67C43]"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#2C1A0E] rounded-[22px] p-4 shadow-[0_16px_36px_rgba(44,26,14,0.18)]">
              <p className="text-[#D8C7A8] text-xs uppercase font-semibold">Precio actual</p>
              <p className="text-[#F8F2E8] text-2xl font-black tracking-tight mt-2">{precioActual.toLocaleString() || '---'}</p>
              <p className="text-[#D8C7A8] text-xs mt-1">COP/carga</p>
            </div>
            <div className={metricCard}>
              <p className="text-gray-400 text-xs uppercase font-semibold">Reseñas</p>
              <p className="text-[#2C1A0E] text-2xl font-black tracking-tight mt-2">⭐ {Number(promedio).toFixed(1)}</p>
              <p className="text-gray-400 text-xs mt-1">{resenas.length} reseñas</p>
            </div>
            <div className={metricCard}>
              <p className="text-gray-400 text-xs uppercase font-semibold">Precios publicados</p>
              <p className="text-[#2C1A0E] text-2xl font-black tracking-tight mt-2">{precios.length}</p>
              <p className="text-gray-400 text-xs mt-1">productos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`lg:col-span-2 ${cardBase} p-5`}>
              <p className={`${sectionTitle} text-sm mb-4`}>📈 Evolución de mis precios</p>
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
                <div className="h-48 flex items-center justify-center rounded-2xl border border-dashed border-[#E7D9BF] bg-[#FCF8F1] text-gray-500 text-sm">
                  Publica más precios para ver la evolución
                </div>
              )}
            </div>

            <div className={`${cardBase} p-5`}>
              <p className={`${sectionTitle} text-sm mb-4`}>📊 Vs. mercado hoy</p>
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
              <div className={`mt-4 rounded-2xl border p-3 text-center text-xs font-semibold ${porEncima ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
                {porEncima ? '▲ Tu precio está por encima del promedio' : '▼ Tu precio está por debajo del promedio'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`${cardBase} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <p className={`${sectionTitle} text-sm`}>⭐ Reseñas recientes</p>
              </div>
              {resenas.length === 0 ? (
                <div className="text-center py-6 rounded-2xl border border-dashed border-[#E7D9BF] bg-[#FCF8F1]">
                  <i className="fa-solid fa-star text-gray-200 text-3xl mb-2"></i>
                  <p className="text-gray-500 text-sm">Aún no hay reseñas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resenas.slice(0, 3).map((r, i) => (
                    <div key={i} className={`pb-3 ${i < Math.min(resenas.length, 3) - 1 ? 'border-b border-[#E7D9BF]' : ''}`}>
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-semibold text-[#2C1A0E]">
                          {r.productor?.nombre} {r.productor?.apellido}
                        </p>
                        <span className="text-[#C8A96E] text-xs">{'★'.repeat(Math.round(r.calificacion))}</span>
                      </div>
                      {r.comentario && <p className="text-xs text-gray-500 italic">"{r.comentario}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`${cardBase} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <p className={`${sectionTitle} text-sm`}>📰 Últimas noticias</p>
                <a href="/noticias" className="text-xs font-semibold text-[#C8A96E] transition-colors hover:text-[#A67C43]">Ver todas →</a>
              </div>
              {noticias.length === 0 ? (
                <div className="text-center py-6 rounded-2xl border border-dashed border-[#E7D9BF] bg-[#FCF8F1]">
                  <i className="fa-solid fa-newspaper text-gray-200 text-3xl mb-2"></i>
                  <p className="text-gray-500 text-sm">No hay noticias recientes</p>
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

      {/* PESTAÑA MIS PRECIOS */}
      {pestana === 'precios' && (
        <div className="px-5 md:px-8 py-5 md:py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`${cardBase} p-5`}>
              <p className="text-gray-400 text-xs uppercase font-semibold">Productos publicados</p>
              <p className="text-[#2C1A0E] text-3xl font-black tracking-tight mt-1">{precios.length}</p>
            </div>
            <div className={`${cardBase} p-5`}>
              <p className="text-gray-400 text-xs uppercase font-semibold">Mejor precio café</p>
              <p className="text-[#C8A96E] text-3xl font-black tracking-tight mt-1">
                {precios.find(p => p.tipocafe === 'pergamino_seco')?.preciocarga?.toLocaleString() || '---'}
              </p>
            </div>
            <div className={`${cardBase} p-5`}>
              <p className="text-gray-400 text-xs uppercase font-semibold">Precio por kilo</p>
              <p className="text-[#2C1A0E] text-3xl font-black tracking-tight mt-1">
                {precios.find(p => p.tipocafe === 'pergamino_seco')?.preciokg?.toLocaleString() || '---'}
              </p>
            </div>
          </div>

          <div className="hidden md:grid grid-cols-5 gap-4 px-4 py-3 bg-[#2C1A0E] rounded-xl text-xs text-gray-400 font-semibold uppercase mb-3">
            <div>Producto</div>
            <div>Precio</div>
            <div>Unidad</div>
            <div>Fecha</div>
            <div>Acciones</div>
          </div>

          {cargando ? (
            <div className="rounded-[22px] border border-dashed border-[#E7D9BF] bg-[#FCF8F1] py-12 text-center text-gray-500">Cargando...</div>
          ) : precios.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#E7D9BF] bg-[#FCF8F1] py-12 text-center text-gray-500">No hay precios publicados aún</div>
          ) : (
            precios.map((item, i) => {
              const tipo = TIPOS_PRODUCTO.find(t => t.value === item.tipocafe);
              return (
                <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-4 px-4 py-4 bg-white rounded-2xl mb-3 items-center hover:shadow-[0_10px_26px_rgba(77,48,24,0.08)] transition-shadow border border-[#E7D9BF]">
                  <div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${BADGE_COLORS[item.tipocafe] || 'bg-gray-100 text-gray-700'}`}>
                      {tipo?.label || item.tipocafe?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-[#2C1A0E]">${item.preciocarga?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">
                      {esPorKg(item.tipocafe) ? 'Por kg' : `Por carga · $${item.preciokg?.toLocaleString()}/kg`}
                    </p>
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
              );
            })
          )}
        </div>
      )}

      {/* Modal publicar precio */}
      {mostrarFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#2C1A0E] font-bold text-lg">Publicar precio del día</h3>
              <button onClick={() => setMostrarFormulario(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <form onSubmit={handlePublicar}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Tipo de producto</label>
                <SelectProducto value={nuevoPrecio.tipocafe}
                  onChange={e => setNuevoPrecio({ ...nuevoPrecio, tipocafe: e.target.value })} />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">
                  Precio {esPorKg(nuevoPrecio.tipocafe) ? 'por kg (COP)' : 'por carga (COP)'}
                </label>
                <input type="number" required
                  placeholder={esPorKg(nuevoPrecio.tipocafe) ? 'Ej: 3500' : 'Ej: 1950000'}
                  value={nuevoPrecio.preciocarga}
                  onChange={e => setNuevoPrecio({ ...nuevoPrecio, preciocarga: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
                <p className="text-xs text-gray-400 mt-1">
                  {esPorKg(nuevoPrecio.tipocafe) ? 'Ingresa el precio por kilogramo' : 'Ingresa el precio por carga de 125 kg'}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => setMostrarFormulario(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={publicandoPrecio}
                  className="flex-1 bg-[#C8A96E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#B8994E] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {publicandoPrecio ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar precio */}
      {mostrarEditar && precioEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#2C1A0E] font-bold text-lg">Editar precio</h3>
              <button onClick={() => setMostrarEditar(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleEditar}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Tipo de producto</label>
                <SelectProducto value={precioEditar.tipocafe}
                  onChange={e => setPrecioEditar({ ...precioEditar, tipocafe: e.target.value })} />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">
                  Precio {esPorKg(precioEditar.tipocafe) ? 'por kg (COP)' : 'por carga (COP)'}
                </label>
                <input type="number" required value={precioEditar.preciocarga}
                  onChange={e => setPrecioEditar({ ...precioEditar, preciocarga: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
                <p className="text-xs text-gray-400 mt-1">
                  {esPorKg(precioEditar.tipocafe) ? 'Ingresa el precio por kilogramo' : 'Ingresa el precio por carga de 125 kg'}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => setMostrarEditar(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-[#2C1A0E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors">
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal eliminar precio */}
      {mostrarEliminar && precioEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl md:p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-trash text-red-500 text-2xl"></i>
            </div>
            <h3 className="text-[#2C1A0E] font-bold text-lg mb-2">¿Eliminar precio?</h3>
            <p className="text-gray-400 text-sm mb-1">Vas a eliminar el precio de</p>
            <p className="text-[#2C1A0E] font-bold text-base mb-1">${precioEliminar.preciocarga?.toLocaleString()} COP</p>
            <p className="text-gray-400 text-xs mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl md:p-8">
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
              <div className="flex flex-col gap-3 sm:flex-row">
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
