import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';

export default function DashboardAdmin() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario } = useAuth();
  const token = localStorage.getItem('token');

  // Config con cookie + token Bearer (doble seguridad)
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

  const [usuarios,      setUsuarios]      = useState([]);
  const [precios,       setPrecios]       = useState([]);
  const [precioFNC,     setPrecioFNC]     = useState(null);
  const [fuenteFNC,     setFuenteFNC]     = useState(null);
  const [noticias,      setNoticias]      = useState([]);
  const [compradores,   setCompradores]   = useState([]);

  // ─── Fetches ──────────────────────────────────────────────────────
  const cargarUsuarios = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/usuario`, authConfig);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Error cargando usuarios:', err.response?.status, err.message);
    }
    finally { setCargandoUsuarios(false); }
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

  const cargarCompradores = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/compradores`, authConfig);
      setCompradores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Error cargando compradores:', err.response?.status, err.message);
    }
    finally { setCargandoCompradores(false); }
  }, [API_URL, token]);

  useEffect(() => {
    cargarUsuarios();
    cargarPrecios();
    cargarFNC();
    cargarNoticias();
    cargarCompradores();
  }, [cargarUsuarios, cargarPrecios, cargarFNC, cargarNoticias, cargarCompradores]);

  // ─── Métricas derivadas ───────────────────────────────────────────
  const totalUsuarios         = usuarios.length;
  const totalProductores      = usuarios.filter(u => u.rol === 'productor').length;
  const totalCompradoresReg   = usuarios.filter(u => u.rol === 'comprador').length;
  const totalAdmins           = usuarios.filter(u => u.rol === 'admin').length;

  const precioMasAlto = precios.length > 0 ? Math.max(...precios.map(p => p.preciocarga)) : 0;
  const precioMasBajo = precios.length > 0 ? Math.min(...precios.map(p => p.preciocarga)) : 0;

  // Compradores (empresas) registradas desde /api/compradores
  const compradoresEmpresas = compradores.length > 0 ? compradores : [];
  // Top 5 compraventas por precio
  const topCompraventas = compradoresEmpresas
    .slice(0, 5)
    .map(c => ({
      nombre: c.nombreempresa || 'Sin nombre',
      municipio: c.municipio || c.direccion?.split(',')[0] || '—',
      id: c._id,
    }));

  // Si no hay datos de compradores, usar precios para mostrar las empresas
  const topCompradores = precios.length > 0
    ? [...precios]
        .sort((a, b) => b.preciocarga - a.preciocarga)
        .slice(0, 5)
        .map(p => ({
          nombre: p.comprador?.nombreempresa || 'Comprador',
          precio: p.preciocarga,
          municipio: p.comprador?.municipio || p.comprador?.direccion?.split(',')[0] || '—',
          id: p.comprador?._id,
        }))
    : [];

  // Compraventas: usar lista de compradores (empresas únicas con precios)
  const compraventasUnicas = precios.reduce((acc, p) => {
    const id = p.comprador?._id;
    if (id && !acc.find(c => c.id === id)) {
      acc.push({
        id,
        nombre: p.comprador?.nombreempresa || 'Sin nombre',
        municipio: p.comprador?.municipio || p.comprador?.direccion?.split(',')[0] || '—',
        precio: p.preciocarga,
      });
    }
    return acc;
  }, []).sort((a, b) => b.precio - a.precio).slice(0, 5);

  const maxPrecioCompraventa = compraventasUnicas[0]?.precio || 1;
  compraventasUnicas.forEach(c => {
    c.pct = Math.round((c.precio / maxPrecioCompraventa) * 100);
  });

  // Usuarios recientes (últimos 5)
  const usuariosRecientes = [...usuarios]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const tagRol = (rol) => {
    if (rol === 'productor') return { label: 'Caficultor',  cls: 'bg-green-100 text-green-700' };
    if (rol === 'comprador') return { label: 'Comprador',   cls: 'bg-blue-100 text-blue-700' };
    if (rol === 'admin')     return { label: 'Admin',       cls: 'bg-amber-100 text-amber-700' };
    return { label: rol, cls: 'bg-gray-100 text-gray-600' };
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  };

  const Skeleton = ({ h = 'h-32', extra = '' }) => (
    <div className={`${h} bg-[#E8D5B0]/40 rounded-2xl animate-pulse ${extra}`} />
  );

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

          {/* Precio más alto mercado */}
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
          </div>

          {/* Noticias publicadas */}
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

        {/* ── Fila media ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Compraventas registradas */}
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

          {/* Top compradores por precio */}
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

          {/* Desglose de usuarios */}
          <div className="bg-[#2C1A0E] rounded-2xl p-5 shadow-sm">
            <p className="text-[#C8A96E] font-bold text-sm mb-4">👥 Desglose de usuarios</p>
            {cargandoUsuarios ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => <div key={i} className="h-8 bg-white/10 rounded animate-pulse" />)}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Caficultores', valor: totalProductores,    emoji: '🌱', pct: totalUsuarios > 0 ? Math.round(totalProductores/totalUsuarios*100) : 0 },
                  { label: 'Compradores',  valor: totalCompradoresReg, emoji: '🏪', pct: totalUsuarios > 0 ? Math.round(totalCompradoresReg/totalUsuarios*100) : 0 },
                  { label: 'Admins',       valor: totalAdmins,         emoji: '🛡️', pct: totalUsuarios > 0 ? Math.round(totalAdmins/totalUsuarios*100) : 0 },
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
                      📰
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
      </div>
    </div>
  );
}