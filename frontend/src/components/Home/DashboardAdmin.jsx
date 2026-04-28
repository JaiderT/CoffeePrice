import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';
import { useNavigate } from 'react-router-dom';

export default function DashboardAdmin() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const authConfig = {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };

  // ─── Estado ───────────────────────────────────────────────────────
  const [cargandoUsuarios,    setCargandoUsuarios]    = useState(true);
  const [cargandoPrecios,     setCargandoPrecios]     = useState(true);
  const [cargandoFNC,         setCargandoFNC]         = useState(true);
  const [cargandoNoticias,    setCargandoNoticias]    = useState(true);
  const [cargandoCompradores, setCargandoCompradores] = useState(true);
  const [cargandoActividad,   setCargandoActividad]   = useState(true);

  const [usuarios,    setUsuarios]    = useState([]);
  const [precios,     setPrecios]     = useState([]);
  const [precioFNC,   setPrecioFNC]   = useState(null);
  const [fuenteFNC,   setFuenteFNC]   = useState(null);
  const [noticias,    setNoticias]    = useState([]);
  const [compradores, setCompradores] = useState([]);
  const [actividad,   setActividad]   = useState([]);

  const [busqueda,  setBusqueda]  = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');

  const [crecimientoSemanal, setCrecimientoSemanal] = useState([]);

  // ─── Fetches ──────────────────────────────────────────────────────
  const cargarUsuarios = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/usuario`, authConfig);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Error cargando usuarios:', err.response?.status, err.message);
    } finally { setCargandoUsuarios(false); }
  }, [API_URL, token]);

  const cargarPrecios = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/precios`);
      setPrecios(data);
    } catch { /* silencioso */ }
    finally { setCargandoPrecios(false); }
  }, [API_URL]);

  const cargarFNC = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/precio-fnc`);
      if (data?.precio) { setPrecioFNC(data.precio); setFuenteFNC(data.fuente); }
    } catch { /* silencioso */ }
    finally { setCargandoFNC(false); }
  }, [API_URL]);

  const cargarNoticias = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/noticias`);
      setNoticias(data.slice(0, 3));
    } catch { /* silencioso */ }
    finally { setCargandoNoticias(false); }
  }, [API_URL]);

  // CORREGIDO: /api/compradores → /api/comprador
  const cargarCompradores = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/comprador`, authConfig);
      setCompradores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Error cargando compradores:', err.response?.status, err.message);
    } finally { setCargandoCompradores(false); }
  }, [API_URL, token]);

  // CONECTADO: ahora usa el endpoint real /api/actividad
  const cargarActividad = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/actividad`, authConfig);
      setActividad(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Error cargando actividad:', err.response?.status, err.message);
      setActividad([]);
    } finally { setCargandoActividad(false); }
  }, [API_URL, token]);

  useEffect(() => {
    cargarUsuarios();
    cargarPrecios();
    cargarFNC();
    cargarNoticias();
    cargarCompradores();
    cargarActividad();
  }, [cargarUsuarios, cargarPrecios, cargarFNC, cargarNoticias, cargarCompradores, cargarActividad]);

  // ── Crecimiento semanal calculado desde usuarios ──
  useEffect(() => {
    if (!usuarios.length) return;
    const semanas = [];
    const ahora = new Date();
    for (let i = 6; i >= 0; i--) {
      const inicio = new Date(ahora);
      inicio.setDate(ahora.getDate() - (i + 1) * 7);
      const fin = new Date(ahora);
      fin.setDate(ahora.getDate() - i * 7);
      const count = usuarios.filter(u => {
        const f = new Date(u.createdAt);
        return f >= inicio && f < fin;
      }).length;
      semanas.push({ label: `S${7 - i}`, count });
    }
    setCrecimientoSemanal(semanas);
  }, [usuarios]);

  // ─── Métricas derivadas ───────────────────────────────────────────
  const totalUsuarios       = usuarios.length;
  const totalProductores    = usuarios.filter(u => u.rol === 'productor').length;
  const totalCompradoresReg = usuarios.filter(u => u.rol === 'comprador').length;
  const totalAdmins         = usuarios.filter(u => u.rol === 'admin').length;

  const precioMasAlto = precios.length > 0 ? Math.max(...precios.map(p => p.preciocarga)) : 0;
  const precioMasBajo = precios.length > 0 ? Math.min(...precios.map(p => p.preciocarga)) : 0;

  const varPctFNC = precioMasAlto > 0 && precioFNC > 0
    ? (((precioMasAlto - precioFNC) / precioFNC) * 100).toFixed(1)
    : null;

  const compraventasUnicas = precios.reduce((acc, p) => {
    const id = p.comprador?._id;
    if (id && !acc.find(c => c.id === id)) {
      acc.push({
        id,
        nombre:    p.comprador?.nombreempresa || 'Sin nombre',
        municipio: p.comprador?.municipio || p.comprador?.direccion?.split(',')[0] || '—',
        precio:    p.preciocarga,
      });
    }
    return acc;
  }, []).sort((a, b) => b.precio - a.precio).slice(0, 5);

  const maxPrecioCompraventa = compraventasUnicas[0]?.precio || 1;
  compraventasUnicas.forEach(c => { c.pct = Math.round((c.precio / maxPrecioCompraventa) * 100); });

  const topCompradores = precios.length > 0
    ? [...precios]
        .sort((a, b) => b.preciocarga - a.preciocarga)
        .slice(0, 5)
        .map(p => ({
          nombre:    p.comprador?.nombreempresa || 'Comprador',
          precio:    p.preciocarga,
          municipio: p.comprador?.municipio || p.comprador?.direccion?.split(',')[0] || '—',
          id:        p.comprador?._id,
        }))
    : [];

  const usuariosRecientes = [...usuarios]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // ── Alertas del sistema ──
  const alertasSistema = useMemo(() => {
    const alertas = [];
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const hace3Dias = new Date();
    hace3Dias.setDate(hace3Dias.getDate() - 3);

    const inactivos = usuarios.filter(u =>
      u.updatedAt && new Date(u.updatedAt) < hace30Dias
    ).length;
    if (inactivos > 0) {
      alertas.push({
        tipo: 'warn',
        texto: `${inactivos} usuario${inactivos > 1 ? 's' : ''} llevan más de 30 días sin actividad`,
        sub: 'Usuarios inactivos',
      });
    }

    const sinActualizar = compraventasUnicas.filter(c => {
      const precio = precios.find(p => p.comprador?._id === c.id);
      return precio?.updatedAt && new Date(precio.updatedAt) < hace3Dias;
    });
    if (sinActualizar.length > 0) {
      alertas.push({
        tipo: 'error',
        texto: `${sinActualizar.length > 1 ? `${sinActualizar.length} compraventas no han` : `"${sinActualizar[0].nombre}" no ha`} actualizado precio en +3 días`,
        sub: 'Precios desactualizados',
      });
    }

    if (precioFNC) {
      alertas.push({
        tipo: 'ok',
        texto: `Precio FNC sincronizado correctamente${fuenteFNC === 'fnc-directo' ? ' con fuente directa' : ' (estimado NY)'}`,
        sub: 'Sistema',
      });
    }

    if (noticias.length === 0) {
      alertas.push({
        tipo: 'warn',
        texto: 'No hay noticias publicadas. Considera publicar contenido nuevo.',
        sub: 'Contenido',
      });
    }

    return alertas;
  }, [usuarios, compraventasUnicas, precios, precioFNC, fuenteFNC, noticias]);

  // ── Buscador de usuarios ──
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const coincideRol =
        filtroRol === 'todos' ||
        (filtroRol === 'productor' && u.rol === 'productor') ||
        (filtroRol === 'comprador' && u.rol === 'comprador') ||
        (filtroRol === 'admin' && u.rol === 'admin');

      const q = busqueda.toLowerCase();
      const coincideBusqueda =
        !q ||
        `${u.nombre} ${u.apellido}`.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.rol?.toLowerCase().includes(q);

      return coincideRol && coincideBusqueda;
    }).slice(0, 5);
  }, [usuarios, busqueda, filtroRol]);

  // ─── Helpers ──────────────────────────────────────────────────────
  const tagRol = (rol) => {
    if (rol === 'productor') return { label: 'Caficultor', cls: 'bg-green-100 text-green-700' };
    if (rol === 'comprador') return { label: 'Comprador',  cls: 'bg-blue-100 text-blue-700' };
    if (rol === 'admin')     return { label: 'Admin',      cls: 'bg-amber-100 text-amber-700' };
    return { label: rol, cls: 'bg-gray-100 text-gray-600' };
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    const hoy = new Date();
    const diff = Math.floor((hoy - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return `Hoy, ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    if (diff === 1) return 'Ayer';
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  };

  const maxCrecimiento = Math.max(...crecimientoSemanal.map(s => s.count), 1);

  const Skeleton = ({ h = 'h-32', extra = '' }) => (
    <div className={`${h} bg-[#E8D5B0]/40 rounded-2xl animate-pulse ${extra}`} />
  );

  const categoriaEmoji = {
    mercado: '📈', internacional: '🌎', clima: '🌧️',
    fnc: '🏛️', produccion: '🌱', consejos: '💡',
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5ECD7]">

      {/* Header */}
      <div className="bg-[#F5ECD7] px-6 md:px-8 py-5 flex items-center justify-between border-b border-[#E0D0B0] flex-wrap gap-3 sticky top-0 z-40">
        <div>
          <h1 className="text-[#2C1A0E] text-2xl font-bold">Panel de administración</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Bienvenido,{' '}
            <span className="text-[#C8A96E] font-semibold">{usuario?.nombre} {usuario?.apellido}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-300 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          <span className="text-green-700 text-xs font-semibold">En vivo</span>
        </div>
      </div>

      <div className="px-6 md:px-8 py-6 flex flex-col gap-5">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {/* Total usuarios */}
          <div className="bg-[#2C1A0E] rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute right-3 bottom-2 opacity-10 text-6xl select-none">👥</div>
            <p className="text-[#C8A96E] text-[10px] uppercase tracking-widest mb-2">Usuarios registrados</p>
            {cargandoUsuarios
              ? <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
              : <p className="text-[#F8F2E8] text-3xl font-bold">{totalUsuarios.toLocaleString()}</p>
            }
            <p className="text-[#8B7355] text-xs mt-1">
              {totalProductores} caficultores · {totalCompradoresReg} compradores
            </p>
          </div>

          {/* Precio FNC */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF] relative overflow-hidden">
            <div className="absolute right-3 bottom-2 opacity-10 text-6xl select-none">🏛️</div>
            <p className="text-[#8B7355] text-[10px] uppercase tracking-widest mb-2">Precio FNC hoy</p>
            {cargandoFNC
              ? <div className="h-8 w-28 bg-[#F5ECD7] rounded animate-pulse" />
              : <p className="text-[#2C1A0E] text-2xl font-bold">
                  {precioFNC ? precioFNC.toLocaleString('es-CO') : '—'}
                  <span className="text-sm text-gray-400 font-normal ml-1">COP</span>
                </p>
            }
            <p className="text-[#8B7355] text-xs mt-1">
              {fuenteFNC === 'fnc-directo' ? '● Fuente directa FNC' : '● Estimado NY'}
            </p>
          </div>

          {/* Precio más alto */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
            <p className="text-[#8B7355] text-[10px] uppercase tracking-widest mb-2">Precio más alto hoy</p>
            {cargandoPrecios
              ? <div className="h-8 w-28 bg-[#F5ECD7] rounded animate-pulse" />
              : <p className="text-[#2C1A0E] text-2xl font-bold">
                  {precioMasAlto > 0 ? precioMasAlto.toLocaleString('es-CO') : '—'}
                  <span className="text-sm text-gray-400 font-normal ml-1">COP</span>
                </p>
            }
            <p className="text-[#8B7355] text-xs mt-1">
              Mínimo: {precioMasBajo > 0 ? precioMasBajo.toLocaleString('es-CO') : '—'} COP
            </p>
            {varPctFNC !== null && (
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-2 ${
                Number(varPctFNC) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {Number(varPctFNC) >= 0 ? '▲' : '▼'} {Math.abs(varPctFNC)}% vs FNC
              </span>
            )}
          </div>

          {/* Noticias */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF] relative overflow-hidden">
            <div className="absolute right-3 bottom-2 opacity-10 text-6xl select-none">📰</div>
            <p className="text-[#8B7355] text-[10px] uppercase tracking-widest mb-2">Noticias publicadas</p>
            {cargandoNoticias
              ? <div className="h-8 w-16 bg-[#F5ECD7] rounded animate-pulse" />
              : <p className="text-[#2C1A0E] text-3xl font-bold">{noticias.length}</p>
            }
            <p className="text-[#8B7355] text-xs mt-1">Últimas 3 visibles</p>
          </div>
        </div>

        {/* ── Alertas del sistema ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#2C1A0E] font-bold text-sm">⚡ Alertas del sistema</p>
            <span className="text-[10px] text-gray-400">se actualizan con cada carga</span>
          </div>
          {alertasSistema.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">Sin alertas activas</p>
          ) : (
            <div className="flex flex-col gap-2">
              {alertasSistema.map((a, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl ${
                  a.tipo === 'ok'    ? 'bg-green-50 border border-green-200' :
                  a.tipo === 'warn'  ? 'bg-amber-50 border border-amber-200' :
                                       'bg-red-50 border border-red-200'
                }`}>
                  <span className="text-base mt-0.5">
                    {a.tipo === 'ok' ? '✅' : a.tipo === 'warn' ? '⚠️' : '❌'}
                  </span>
                  <div>
                    <p className={`text-xs font-semibold ${
                      a.tipo === 'ok' ? 'text-green-700' : a.tipo === 'warn' ? 'text-amber-700' : 'text-red-700'
                    }`}>{a.texto}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{a.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Fila media ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Compraventas */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#2C1A0E] font-bold text-sm">🏪 Compraventas activas</p>
              <span className="text-xs text-gray-400">{compraventasUnicas.length} con precios publicados</span>
            </div>
            {cargandoPrecios ? (
              <div className="flex flex-col gap-2">
                {[1,2,3,4,5].map(i => <Skeleton key={i} h="h-8" />)}
              </div>
            ) : compraventasUnicas.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">Sin compraventas registradas aún</p>
            ) : (
              <div className="flex flex-col gap-2">
                {compraventasUnicas.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#F5ECD7] rounded-lg flex items-center justify-center text-xs shrink-0">🏪</div>
                    <span className="text-xs text-[#8B7355] w-28 shrink-0 truncate">{c.nombre}</span>
                    <div className="flex-1 h-1.5 bg-[#F5ECD7] rounded-full">
                      <div className="h-1.5 rounded-full bg-[#C8A96E]" style={{ width: `${c.pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-[#2C1A0E] w-24 text-right">
                      {c.precio.toLocaleString('es-CO')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Usuarios recientes */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#2C1A0E] font-bold text-sm">🆕 Registros recientes</p>
              <span className="text-xs text-gray-400">{totalUsuarios} total</span>
            </div>
            {cargandoUsuarios ? (
              <div className="flex flex-col gap-2">
                {[1,2,3,4,5].map(i => <Skeleton key={i} h="h-9" />)}
              </div>
            ) : usuariosRecientes.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">Sin usuarios aún</p>
            ) : (
              <div className="flex flex-col gap-2">
                {usuariosRecientes.map((u, i) => {
                  const tag = tagRol(u.rol);
                  const iniciales = `${u.nombre?.[0] || ''}${u.apellido?.[0] || ''}`.toUpperCase();
                  return (
                    <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-[#F5ECD7] last:border-0">
                      <div className="w-7 h-7 rounded-full bg-[#F5ECD7] border border-[#E0D0B0] flex items-center justify-center text-[10px] text-[#C8A96E] font-bold shrink-0">
                        {iniciales}
                      </div>
                      <span className="text-xs text-[#2C1A0E] flex-1 truncate font-medium">
                        {u.nombre} {u.apellido}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tag.cls}`}>
                        {tag.label}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">{formatFecha(u.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Fila inferior ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Top compradores */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
            <p className="text-[#2C1A0E] font-bold text-sm mb-4">🏆 Mejores precios hoy</p>
            {cargandoPrecios ? (
              <div className="flex flex-col gap-2">
                {[1,2,3,4,5].map(i => <Skeleton key={i} h="h-9" />)}
              </div>
            ) : topCompradores.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">Sin precios publicados</p>
            ) : (
              <div className="flex flex-col gap-2">
                {topCompradores.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b border-[#F5ECD7] last:border-0">
                    <span className="text-xs text-gray-400 w-4 font-bold shrink-0">{i + 1}</span>
                    <div className="w-7 h-7 bg-[#F5ECD7] rounded-lg flex items-center justify-center text-sm shrink-0">🏪</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#2C1A0E] truncate font-medium">{c.nombre}</p>
                      <p className="text-[10px] text-gray-400 truncate">📍 {c.municipio}</p>
                    </div>
                    <span className="text-xs font-bold text-[#2C1A0E] shrink-0">
                      {c.precio.toLocaleString('es-CO')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desglose usuarios + crecimiento semanal */}
          <div className="bg-[#2C1A0E] rounded-2xl p-5 shadow-sm">
            <p className="text-[#C8A96E] font-bold text-sm mb-4">👥 Desglose de usuarios</p>
            {cargandoUsuarios ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => <div key={i} className="h-8 bg-white/10 rounded animate-pulse" />)}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Caficultores', valor: totalProductores,    emoji: '🌱', pct: totalUsuarios > 0 ? Math.round(totalProductores / totalUsuarios * 100) : 0 },
                  { label: 'Compradores',  valor: totalCompradoresReg, emoji: '🏪', pct: totalUsuarios > 0 ? Math.round(totalCompradoresReg / totalUsuarios * 100) : 0 },
                  { label: 'Admins',       valor: totalAdmins,         emoji: '🛡️', pct: totalUsuarios > 0 ? Math.round(totalAdmins / totalUsuarios * 100) : 0 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#D8C7A8] text-xs">{item.emoji} {item.label}</span>
                      <span className="text-[#F8F2E8] text-xs font-bold">{item.valor} ({item.pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full">
                      <div className="h-1.5 rounded-full bg-[#C8A96E]" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                  <span className="text-[#8B7355] text-xs">Total</span>
                  <span className="text-[#F8F2E8] text-sm font-bold">{totalUsuarios}</span>
                </div>
                {crecimientoSemanal.length > 0 && (
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-[#8B7355] text-[10px] mb-2">Nuevos usuarios por semana</p>
                    <div className="flex items-end gap-1 h-12">
                      {crecimientoSemanal.map((s, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className={`w-full rounded-sm ${i === crecimientoSemanal.length - 1 ? 'bg-[#C8A96E]' : 'bg-white/20'}`}
                            style={{ height: `${Math.max(4, Math.round((s.count / maxCrecimiento) * 40))}px` }}
                          />
                          <span className="text-[8px] text-[#8B7355]">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Noticias recientes */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
            <p className="text-[#2C1A0E] font-bold text-sm mb-4">🗞️ Noticias recientes</p>
            {cargandoNoticias ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => <Skeleton key={i} h="h-14" />)}
              </div>
            ) : noticias.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">Sin noticias publicadas</p>
            ) : (
              <div className="flex flex-col gap-3">
                {noticias.map((n, i) => (
                  <div key={i} className="flex gap-3 pb-3 border-b border-[#F5ECD7] last:border-0">
                    <div className="w-8 h-8 bg-[#F5ECD7] rounded-xl flex items-center justify-center text-base shrink-0">
                      {categoriaEmoji[n.categoria] || '📰'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#2C1A0E] leading-snug line-clamp-2">{n.titulo}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatFecha(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Actividad + Buscador + Acciones rápidas ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Timeline de actividad — ahora conectado al backend */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
            <p className="text-[#2C1A0E] font-bold text-sm mb-4">🕐 Actividad reciente</p>
            {cargandoActividad ? (
              <div className="flex flex-col gap-2">
                {[1,2,3,4,5].map(i => <Skeleton key={i} h="h-10" />)}
              </div>
            ) : actividad.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Sin actividad registrada</p>
            ) : (
              <div className="flex flex-col">
                {actividad.map((a, i) => (
                  <div key={i} className="flex gap-3 py-2.5 border-b border-[#F5ECD7] last:border-0">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ background: a.color || '#C8A96E' }}
                    />
                    <div>
                      <p className="text-xs text-[#2C1A0E] leading-snug">{a.texto}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatFecha(a.fecha)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buscador de usuarios */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
            <p className="text-[#2C1A0E] font-bold text-sm mb-3">🔍 Buscar usuario</p>
            <input
              type="text"
              placeholder="Nombre, correo o rol..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E7D9BF] text-xs focus:outline-none focus:border-[#C8A96E] bg-[#FDFAF5] mb-3"
            />
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {[
                { key: 'todos',     label: 'Todos' },
                { key: 'productor', label: 'Caficult.' },
                { key: 'comprador', label: 'Comprad.' },
                { key: 'admin',     label: 'Admin' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFiltroRol(f.key)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
                    filtroRol === f.key
                      ? 'bg-[#2C1A0E] text-[#F8F2E8] border-[#2C1A0E]'
                      : 'bg-[#F5ECD7] text-[#8B7355] border-[#E0D0B0] hover:bg-[#E0D0B0]'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
            {cargandoUsuarios ? (
              <div className="flex flex-col gap-2">
                {[1,2,3].map(i => <Skeleton key={i} h="h-9" />)}
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No se encontraron usuarios</p>
            ) : (
              <div className="flex flex-col">
                {usuariosFiltrados.map((u, i) => {
                  const tag = tagRol(u.rol);
                  const iniciales = `${u.nombre?.[0] || ''}${u.apellido?.[0] || ''}`.toUpperCase();
                  return (
                    <div key={i} className="flex items-center gap-2.5 py-2 border-b border-[#F5ECD7] last:border-0">
                      <div className="w-7 h-7 rounded-full bg-[#F5ECD7] border border-[#E0D0B0] flex items-center justify-center text-[10px] text-[#C8A96E] font-bold shrink-0">
                        {iniciales}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#2C1A0E] truncate">{u.nombre} {u.apellido}</p>
                        <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${tag.cls}`}>
                        {tag.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {usuarios.length > 5 && (
              <p className="text-[10px] text-gray-400 text-center mt-2">
                {usuariosFiltrados.length} de {usuarios.filter(u =>
                  filtroRol === 'todos' || u.rol === filtroRol
                ).length} resultado(s)
              </p>
            )}
          </div>

          {/* Acciones rápidas */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
            <p className="text-[#2C1A0E] font-bold text-sm mb-4">⚙️ Acciones rápidas</p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => navigate('/admin/perfil')}
                className="w-full bg-[#2C1A0E] hover:bg-[#3D2510] text-[#F5ECD7] py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors text-left">
                📰 Publicar nueva noticia
              </button>
              <button
                onClick={() => {
                  const csv = ['Nombre,Apellido,Email,Rol,Fecha']
                    .concat(usuarios.map(u =>
                      `${u.nombre},${u.apellido},${u.email},${u.rol},${new Date(u.createdAt).toLocaleDateString('es-CO')}`
                    ))
                    .join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'usuarios.csv'; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full bg-green-50 hover:bg-green-100 border border-green-200 text-green-800 py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors text-left">
                📊 Exportar usuarios a CSV
              </button>
              <button
                onClick={() => navigate('/precios')}
                className="w-full bg-[#F5ECD7] hover:bg-[#E0D0B0] text-[#2C1A0E] py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors text-left border border-[#E0D0B0]">
                💹 Ver todos los precios
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}