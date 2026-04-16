import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function Historial() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [historial, setHistorial] = useState([]);
  const [compradores, setCompradores] = useState([]);
  const [compradorSeleccionado, setCompradorSeleccionado] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [cargando, setCargando] = useState(true);

  // ✅ useCallback para obtenerCompradores
  const obtenerCompradores = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/precios`);
      const unicos = [];
      const ids = new Set();
      data.forEach(p => {
        if (p.comprador && !ids.has(p.comprador._id)) {
          ids.add(p.comprador._id);
          unicos.push(p.comprador);
        }
      });
      setCompradores(unicos);
    } catch (error) {
      console.error('Error al obtener compradores:', error);
    }
  }, [API_URL]);

  // ✅ useCallback para obtenerHistorial
  const obtenerHistorial = useCallback(async () => {
    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (compradorSeleccionado !== 'todos') params.append('compradorId', compradorSeleccionado);
      if (filtroTipo !== 'todos') params.append('tipocafe', filtroTipo);

      const { data } = await axios.get(
        `${API_URL}/api/historial-precios?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistorial(data);
    } catch (error) {
      console.error('Error al obtener historial:', error);
    } finally {
      setCargando(false);
    }
  }, [API_URL, compradorSeleccionado, filtroTipo]);

  // ✅ useEffect con dependencias correctas
  useEffect(() => {
    obtenerCompradores();
    obtenerHistorial();
  }, [obtenerCompradores, obtenerHistorial]);

  // Datos para la gráfica — agrupa por comprador
  const datosGrafica = historial.slice(0, 15).map((h) => ({  // ← cambiamos 'i' por 'idx'
    fecha: new Date(h.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
    precio: h.preciocarga,
    comprador: h.comprador?.nombreempresa?.slice(0, 8) || '---',
  }));

  const filtrosTipo = [
    { value: 'todos', label: 'Todos' },
    { value: 'pergamino_seco', label: 'Pergamino' },
    { value: 'especial', label: 'Especial' },
    { value: 'organico', label: 'Orgánico' },
    { value: 'verde', label: 'Verde' },
  ];

  const mejorPrecio = historial.length > 0 ? Math.max(...historial.map(h => h.preciocarga)) : 0;
  const precioPromedio = historial.length > 0
    ? Math.round(historial.reduce((acc, h) => acc + h.preciocarga, 0) / historial.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#F7F1E3]">

      {/* Header */}
      <div className="px-5 md:px-8 pt-6 md:pt-8 pb-5 border-b border-[#E7D9BF] bg-[linear-gradient(180deg,#F7EEDC_0%,#F7F1E3_100%)]">
        <span className="inline-flex items-center rounded-full bg-[#2C1A0E] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#F5ECD7]">
          Historial
        </span>
        <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-[#2C1A0E]">
          Historial de precios
        </h1>
        <p className="mt-2 text-sm text-[#6B5A4D]">
          Evolución de precios registrados por los compradores a lo largo del tiempo.
        </p>
      </div>

      {/* Stats */}
      <div className="px-5 md:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-[#2C1A0E] p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#D8C7A8]">Precio más alto registrado</p>
            <p className="mt-3 text-2xl font-bold text-[#F8F2E8]">{mejorPrecio.toLocaleString()}</p>
            <p className="text-xs text-[#D8C7A8] mt-1">COP por carga</p>
          </div>
          <div className="rounded-2xl bg-white border border-[#E7D9BF] p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#8B7355]">Precio promedio histórico</p>
            <p className="mt-3 text-2xl font-bold text-[#2C1A0E]">{precioPromedio.toLocaleString()}</p>
            <p className="text-xs text-[#8B7355] mt-1">COP por carga</p>
          </div>
          <div className="rounded-2xl bg-white border border-[#E7D9BF] p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#8B7355]">Total de registros</p>
            <p className="mt-3 text-2xl font-bold text-[#2C1A0E]">{historial.length}</p>
            <p className="text-xs text-[#8B7355] mt-1">cambios de precio registrados</p>
          </div>
        </div>
      </div>

      {/* Gráfica */}
      {datosGrafica.length > 1 && (
        <div className="px-5 md:px-8 pb-6">
          <div className="bg-white rounded-2xl border border-[#E7D9BF] p-5 shadow-sm">
            <p className="text-sm font-bold text-[#2C1A0E] mb-4">Evolución de precios</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosGrafica}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1E7D3" />
                  <XAxis dataKey="fecha" tick={{ fill: '#8B7355', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#8B7355', fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    formatter={(v, n, props) => [`$${v.toLocaleString()}`, props.payload.comprador]}
                    labelFormatter={l => `Fecha: ${l}`}
                  />
                  <Line type="monotone" dataKey="precio" stroke="#C8A96E" strokeWidth={3} dot={{ fill: '#C8A96E', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="px-5 md:px-8 pb-5">
        <div className="rounded-2xl border border-[#E7D9BF] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            {/* Filtro por comprador */}
            <div>
              <p className="text-xs font-semibold text-[#8B7355] mb-2 uppercase">Comprador</p>
              <select
                value={compradorSeleccionado}
                onChange={e => setCompradorSeleccionado(e.target.value)}
                className="w-full rounded-xl border border-[#DCC9A6] bg-[#FCFAF6] py-2.5 px-4 text-sm text-[#2C1A0E] focus:outline-none focus:ring-2 focus:ring-[#C8A96E]/30">
                <option value="todos">Todos los compradores</option>
                {compradores.map((c, idx) => (  // ← cambiamos 'i' por 'idx'
                  <option key={idx} value={c._id}>{c.nombreempresa}</option>
                ))}
              </select>
            </div>
            {/* Filtro por tipo */}
            <div>
              <p className="text-xs font-semibold text-[#8B7355] mb-2 uppercase">Tipo de café</p>
              <div className="flex flex-wrap gap-2">
                {filtrosTipo.map((f, idx) => (  // ← cambiamos 'i' por 'idx'
                  <button key={idx} onClick={() => setFiltroTipo(f.value)}
                    className={`rounded-full px-3 py-2 text-xs font-bold transition-colors ${filtroTipo === f.value
                        ? 'bg-[#2C1A0E] text-[#F5ECD7]'
                        : 'bg-[#F8F3EA] border border-[#E7D9BF] text-[#6B5A4D] hover:bg-[#EFE4CF]'
                      }`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista historial */}
      <div className="px-5 md:px-8 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#2C1A0E] font-bold text-lg">Registros de cambios</h2>
          <span className="rounded-full bg-white border border-[#E7D9BF] px-3 py-1.5 text-xs font-semibold text-[#6B5A4D]">
            {historial.length} registros
          </span>
        </div>

        {cargando ? (
          <div className="rounded-2xl bg-white border border-[#E7D9BF] py-12 text-center text-sm text-[#8B7355]">
            Cargando historial...
          </div>
        ) : historial.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E7D9BF] py-12 text-center">
            <i className="fa-solid fa-chart-line text-gray-200 text-4xl mb-3"></i>
            <p className="text-sm font-semibold text-[#2C1A0E]">No hay registros aún</p>
            <p className="text-xs text-[#8B7355] mt-1">Los cambios de precio aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historial.map((item, idx) => {  // ← cambiamos 'i' por 'idx'
              const anterior = historial[idx + 1];
              const diferencia = anterior ? item.preciocarga - anterior.preciocarga : null;
              const sube = diferencia > 0;

              return (
                <div key={idx} className="rounded-2xl border border-[#E7D9BF] bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${diferencia === null ? 'bg-[#F5ECD7] text-[#7A4020]' :
                          sube ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                        }`}>
                        {diferencia === null ? <i className="fa-solid fa-minus text-xs"></i> :
                          sube ? <i className="fa-solid fa-arrow-up text-xs"></i> :
                            <i className="fa-solid fa-arrow-down text-xs"></i>}
                      </div>
                      <div>
                        <p className="font-bold text-[#2C1A0E] text-sm">{item.comprador?.nombreempresa || 'Sin nombre'}</p>
                        <p className="text-xs text-[#8B7355]">
                          {new Date(item.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' · '}
                          {new Date(item.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[11px] uppercase font-bold text-[#8B7355]">Precio/carga</p>
                        <p className="text-lg font-bold text-[#2C1A0E]">{item.preciocarga?.toLocaleString()}</p>
                      </div>
                      {diferencia !== null && (
                        <div>
                          <p className="text-[11px] uppercase font-bold text-[#8B7355]">Variación</p>
                          <p className={`text-sm font-bold ${sube ? 'text-green-600' : 'text-red-500'}`}>
                            {sube ? '+' : ''}{diferencia.toLocaleString()}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${item.tipocafe === 'especial' ? 'bg-[#F3E8FF] text-[#7E22CE]' :
                            item.tipocafe === 'organico' ? 'bg-[#E8F5EA] text-[#2D6A4F]' :
                              item.tipocafe === 'verde' ? 'bg-[#E6F6F0] text-[#147D64]' :
                                'bg-[#FFF4D6] text-[#9A6700]'
                          }`}>
                          {item.tipocafe === 'pergamino_seco' ? 'Pergamino' :
                            item.tipocafe === 'especial' ? 'Especial' :
                              item.tipocafe === 'organico' ? 'Orgánico' : 'Verde'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export default Historial;