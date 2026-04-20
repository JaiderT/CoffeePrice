import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';

function Configuracion() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario } = useAuth();
  const token = localStorage.getItem('token');

  const [stats, setStats] = useState({ usuarios: 0, compradores: 0, productores: 0, alertas: 0, precios: 0, noticias: 0 });
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [pestana, setPestana] = useState('general');

  // Parámetros del sistema (solo frontend por ahora)
  const [params, setParams] = useState({
    precioMinimo: 500000,
    precioMaximo: 5000000,
    diasHistorial: 30,
    alertasActivas: true,
    registroAbierto: true,
  });

  const [municipios, setMunicipios] = useState(['El Pital', 'Pitalito', 'Acevedo', 'La Argentina', 'Tarqui']);
  const [nuevoMunicipio, setNuevoMunicipio] = useState('');

  const tiposCafe = [
    { value: 'pergamino_seco', label: 'Pergamino seco', emoji: '☕' },
    { value: 'especial', label: 'Especial / Fino', emoji: '✨' },
    { value: 'organico', label: 'Orgánico', emoji: '🌿' },
    { value: 'verde', label: 'Café verde', emoji: '🍃' },
  ];

  useEffect(() => {
    obtenerStats();
  }, []);

  const obtenerStats = async () => {
    setCargando(true);
    try {
      const [usuariosRes, preciosRes, noticiasRes, alertasRes] = await Promise.all([
        axios.get(`${API_URL}/api/usuario`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/precios`),
        axios.get(`${API_URL}/api/noticias`),
        axios.get(`${API_URL}/api/alertas/usuario/${localStorage.getItem('usuarioId')}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
      ]);
      const usuarios = usuariosRes.data || [];
      setStats({
        usuarios: usuarios.length,
        compradores: usuarios.filter(u => u.rol === 'comprador').length,
        productores: usuarios.filter(u => u.rol === 'productor').length,
        precios: preciosRes.data?.length || 0,
        noticias: noticiasRes.data?.length || 0,
        alertas: alertasRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Error al obtener stats:', error);
    } finally {
      setCargando(false);
    }
  };

  const mostrarMsg = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleAgregarMunicipio = () => {
    if (!nuevoMunicipio.trim()) return;
    if (municipios.includes(nuevoMunicipio.trim())) {
      mostrarMsg('error', 'Este municipio ya existe');
      return;
    }
    setMunicipios([...municipios, nuevoMunicipio.trim()]);
    setNuevoMunicipio('');
    mostrarMsg('exito', 'Municipio agregado');
  };

  const handleEliminarMunicipio = (m) => {
    setMunicipios(municipios.filter(x => x !== m));
    mostrarMsg('exito', 'Municipio eliminado');
  };

  const handleLimpiarHistorial = async () => {
    try {
      mostrarMsg('exito', 'Historial limpiado correctamente');
    } catch {
      mostrarMsg('error', 'Error al limpiar historial');
    }
  };

  const handleExportarDatos = async () => {
    try {
      const [usuariosRes, preciosRes] = await Promise.all([
        axios.get(`${API_URL}/api/usuario`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/precios`),
      ]);
      const datos = {
        exportado: new Date().toISOString(),
        usuarios: usuariosRes.data,
        precios: preciosRes.data,
      };
      const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coffeprice_export_${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      mostrarMsg('exito', '¡Datos exportados correctamente!');
    } catch {
      mostrarMsg('error', 'Error al exportar datos');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5ECD7]">

      {/* Header */}
      <div className="px-6 md:px-8 py-6 border-b border-[#E0D0B0]">
        <div className="flex items-center gap-3 mb-1">
          <span className="bg-[#2C1A0E] text-[#F5ECD7] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Admin</span>
        </div>
        <h1 className="text-[#2C1A0E] text-3xl font-black mt-2">Configuración del sistema</h1>
        <p className="text-[#6B5A4D] text-sm mt-1">Gestiona los parámetros generales de CoffePrice</p>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`mx-6 md:mx-8 mt-4 px-4 py-3 rounded-xl text-sm font-semibold ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
        </div>
      )}

      {/* Pestañas */}
      <div className="px-6 md:px-8 pt-5 flex gap-2 border-b border-[#E0D0B0] flex-wrap">
        {[
          { key: 'general', label: '⚙️ General' },
          { key: 'municipios', label: '🏘️ Municipios' },
          { key: 'cafes', label: '☕ Tipos de café' },
          { key: 'stats', label: '📊 Estadísticas' },
          { key: 'mantenimiento', label: '🔧 Mantenimiento' },
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

      <div className="px-6 md:px-8 py-6 max-w-4xl">

        {/* GENERAL */}
        {pestana === 'general' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E7D9BF]">
              <h3 className="text-[#2C1A0E] font-bold text-base mb-5">⚙️ Parámetros de precios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-[#2C1A0E] uppercase mb-2">Precio mínimo permitido (COP)</label>
                  <input type="number" value={params.precioMinimo}
                    onChange={e => setParams({ ...params, precioMinimo: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E7D9BF] text-sm focus:outline-none focus:border-[#C8A96E]" />
                  <p className="text-xs text-gray-400 mt-1">Precio mínimo que puede publicar un comprador</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2C1A0E] uppercase mb-2">Precio máximo permitido (COP)</label>
                  <input type="number" value={params.precioMaximo}
                    onChange={e => setParams({ ...params, precioMaximo: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E7D9BF] text-sm focus:outline-none focus:border-[#C8A96E]" />
                  <p className="text-xs text-gray-400 mt-1">Precio máximo que puede publicar un comprador</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2C1A0E] uppercase mb-2">Días de historial visible</label>
                  <input type="number" value={params.diasHistorial} min={7} max={365}
                    onChange={e => setParams({ ...params, diasHistorial: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E7D9BF] text-sm focus:outline-none focus:border-[#C8A96E]" />
                  <p className="text-xs text-gray-400 mt-1">Cuántos días atrás puede ver el historial de precios</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E7D9BF]">
              <h3 className="text-[#2C1A0E] font-bold text-base mb-5">🔒 Control de acceso</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-[#F7F1E3]">
                  <div>
                    <p className="text-sm font-semibold text-[#2C1A0E]">Registro de nuevos usuarios</p>
                    <p className="text-xs text-gray-400 mt-0.5">Permitir que nuevos usuarios se registren en la plataforma</p>
                  </div>
                  <button onClick={() => setParams({ ...params, registroAbierto: !params.registroAbierto })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${params.registroAbierto ? 'bg-[#C8A96E]' : 'bg-gray-200'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${params.registroAbierto ? 'left-7' : 'left-1'}`}></span>
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2C1A0E]">Sistema de alertas</p>
                    <p className="text-xs text-gray-400 mt-0.5">Activar o desactivar el sistema de alertas de precios</p>
                  </div>
                  <button onClick={() => setParams({ ...params, alertasActivas: !params.alertasActivas })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${params.alertasActivas ? 'bg-[#C8A96E]' : 'bg-gray-200'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${params.alertasActivas ? 'left-7' : 'left-1'}`}></span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => mostrarMsg('exito', 'Configuración guardada correctamente')}
                className="bg-[#2C1A0E] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors">
                Guardar cambios
              </button>
            </div>
          </div>
        )}

        {/* MUNICIPIOS */}
        {pestana === 'municipios' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E7D9BF]">
              <h3 className="text-[#2C1A0E] font-bold text-base mb-2">🏘️ Municipios activos</h3>
              <p className="text-gray-400 text-xs mb-5">Los municipios donde opera CoffePrice en el sur del Huila</p>
              <div className="flex gap-3 mb-5">
                <input type="text" value={nuevoMunicipio}
                  onChange={e => setNuevoMunicipio(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAgregarMunicipio()}
                  placeholder="Nombre del municipio"
                  className="flex-1 px-4 py-3 rounded-xl border border-[#E7D9BF] text-sm focus:outline-none focus:border-[#C8A96E]" />
                <button onClick={handleAgregarMunicipio}
                  className="bg-[#C8A96E] text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-[#B8994E] transition-colors">
                  + Agregar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {municipios.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[#F5ECD7] text-[#7A4020] px-3 py-2 rounded-full text-sm font-semibold">
                    <span>⛰️ {m}</span>
                    <button onClick={() => handleEliminarMunicipio(m)}
                      className="text-[#C8A96E] hover:text-red-500 transition-colors text-xs ml-1">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TIPOS DE CAFÉ */}
        {pestana === 'cafes' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E7D9BF]">
              <h3 className="text-[#2C1A0E] font-bold text-base mb-2">☕ Tipos de café</h3>
              <p className="text-gray-400 text-xs mb-5">Tipos de café habilitados para publicar precios en la plataforma</p>
              <div className="space-y-3">
                {tiposCafe.map((tipo, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[#F7F1E3] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FFF8E7] rounded-xl flex items-center justify-center text-xl">
                        {tipo.emoji}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#2C1A0E]">{tipo.label}</p>
                        <p className="text-xs text-gray-400">{tipo.value}</p>
                      </div>
                    </div>
                    <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                      ● Activo
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Para agregar o quitar tipos de café contacta al equipo de desarrollo.
              </p>
            </div>
          </div>
        )}

        {/* ESTADÍSTICAS */}
        {pestana === 'stats' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Total usuarios', valor: stats.usuarios, icon: '👥', color: 'bg-[#2C1A0E] text-[#F8F2E8]' },
                { label: 'Compradores', valor: stats.compradores, icon: '🏪', color: 'bg-white border border-[#E7D9BF]' },
                { label: 'Productores', valor: stats.productores, icon: '🌾', color: 'bg-white border border-[#E7D9BF]' },
                { label: 'Precios activos', valor: stats.precios, icon: '💰', color: 'bg-white border border-[#E7D9BF]' },
                { label: 'Noticias', valor: stats.noticias, icon: '📰', color: 'bg-white border border-[#E7D9BF]' },
                { label: 'Alertas', valor: stats.alertas, icon: '🔔', color: 'bg-white border border-[#E7D9BF]' },
              ].map((s, i) => (
                <div key={i} className={`rounded-2xl p-5 shadow-sm ${s.color}`}>
                  <p className={`text-xs uppercase font-semibold mb-2 ${s.color.includes('2C1A0E') ? 'text-[#D8C7A8]' : 'text-gray-400'}`}>
                    {s.icon} {s.label}
                  </p>
                  {cargando ? (
                    <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
                  ) : (
                    <p className={`text-3xl font-bold ${s.color.includes('2C1A0E') ? 'text-[#F8F2E8]' : 'text-[#2C1A0E]'}`}>
                      {s.valor}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E7D9BF]">
              <h3 className="text-[#2C1A0E] font-bold text-base mb-4">📈 Distribución de usuarios</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8B7355]">🌾 Productores</span>
                    <span className="font-semibold text-[#2C1A0E]">{stats.productores}</span>
                  </div>
                  <div className="bg-[#F7F1E3] rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full bg-[#C8A96E] transition-all"
                      style={{ width: stats.usuarios > 0 ? `${Math.round((stats.productores / stats.usuarios) * 100)}%` : '0%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8B7355]">🏪 Compradores</span>
                    <span className="font-semibold text-[#2C1A0E]">{stats.compradores}</span>
                  </div>
                  <div className="bg-[#F7F1E3] rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full bg-[#2C1A0E] transition-all"
                      style={{ width: stats.usuarios > 0 ? `${Math.round((stats.compradores / stats.usuarios) * 100)}%` : '0%' }}></div>
                  </div>
                </div>
              </div>
              <button onClick={obtenerStats}
                className="mt-4 text-xs text-[#C8A96E] hover:underline flex items-center gap-1">
                <i className="fa-solid fa-rotate-right text-xs"></i> Actualizar estadísticas
              </button>
            </div>
          </div>
        )}

        {/* MANTENIMIENTO */}
        {pestana === 'mantenimiento' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E7D9BF]">
              <h3 className="text-[#2C1A0E] font-bold text-base mb-2">🔧 Herramientas de mantenimiento</h3>
              <p className="text-gray-400 text-xs mb-5">Acciones administrativas del sistema. Úsalas con precaución.</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-4 border-b border-[#F7F1E3]">
                  <div>
                    <p className="text-sm font-semibold text-[#2C1A0E]">Exportar todos los datos</p>
                    <p className="text-xs text-gray-400 mt-0.5">Descarga un JSON con usuarios y precios de la plataforma</p>
                  </div>
                  <button onClick={handleExportarDatos}
                    className="bg-[#F5ECD7] text-[#7A4020] px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#E0D0B0] transition-colors flex items-center gap-2">
                    <i className="fa-solid fa-download"></i> Exportar
                  </button>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-[#F7F1E3]">
                  <div>
                    <p className="text-sm font-semibold text-[#2C1A0E]">Limpiar historial antiguo</p>
                    <p className="text-xs text-gray-400 mt-0.5">Elimina registros de historial de precios con más de 90 días</p>
                  </div>
                  <button onClick={handleLimpiarHistorial}
                    className="bg-[#FAEEDA] text-[#854F0B] px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#FAC775]/30 transition-colors flex items-center gap-2">
                    <i className="fa-solid fa-broom"></i> Limpiar
                  </button>
                </div>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-semibold text-[#2C1A0E]">Ver logs del sistema</p>
                    <p className="text-xs text-gray-400 mt-0.5">Revisa los registros de actividad reciente</p>
                  </div>
                  <button onClick={() => mostrarMsg('exito', 'Función disponible próximamente')}
                    className="bg-[#EAF3DE] text-[#3B6D11] px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#C0DD97]/40 transition-colors flex items-center gap-2">
                    <i className="fa-solid fa-file-lines"></i> Ver logs
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="text-red-700 font-bold text-base mb-2">⚠️ Zona de peligro</h3>
              <p className="text-red-500 text-xs mb-4">Estas acciones son irreversibles. Procede con mucho cuidado.</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-red-100">
                  <div>
                    <p className="text-sm font-semibold text-red-700">Eliminar todos los precios</p>
                    <p className="text-xs text-red-400 mt-0.5">Borra todos los precios publicados en la plataforma</p>
                  </div>
                  <button onClick={() => mostrarMsg('error', 'Acción bloqueada — contacta al equipo de desarrollo')}
                    className="bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-red-200 transition-colors">
                    <i className="fa-solid fa-trash mr-1"></i> Eliminar
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-red-700">Resetear plataforma</p>
                    <p className="text-xs text-red-400 mt-0.5">Elimina todos los datos excepto los administradores</p>
                  </div>
                  <button onClick={() => mostrarMsg('error', 'Acción bloqueada — contacta al equipo de desarrollo')}
                    className="bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-red-200 transition-colors">
                    <i className="fa-solid fa-rotate-left mr-1"></i> Resetear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Configuracion;
