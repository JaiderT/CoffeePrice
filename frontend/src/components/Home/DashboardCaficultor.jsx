import { useState, useEffect, useCallback } from "react";
import { useAuth } from '../../context/useAuth.js';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DashboardProductor() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario } = useAuth();

  // ─── Estado ───────────────────────────────────────────────────────
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState(null);

  // Precios
  const [todosPrecios, setTodosPrecios] = useState([]);
  const [precioPromedio, setPrecioPromedio] = useState(0);
  const [precioMasAlto, setPrecioMasAlto] = useState(0);
  const [precioFNC] = useState(1890000);
  const [topCompradores, setTopCompradores] = useState([]);

  // Clima
  const [clima, setClima] = useState(null);

  // Alertas
  const [alertaActiva, setAlertaActiva] = useState(null);
  const [alertaPrecio, setAlertaPrecio] = useState(2000000);
  const [guardandoAlerta, setGuardandoAlerta] = useState(false);

  // Historial / gráfica
  const [historial, setHistorial] = useState([]);
  const [rangoGrafica, setRangoGrafica] = useState("30D");

  // Noticias
  const [noticias, setNoticias] = useState([]);

  // Calculadora
  const [cargas, setCargas] = useState(3);

  // ─── Helpers ──────────────────────────────────────────────────────
  const mostrarMsg = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3000);
  };

  // ─── Carga de datos ───────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Precios del mercado — GET /api/precios (público)
      const preciosRes = await axios.get(`${API_URL}/api/precios`);
      const precios = preciosRes.data;
      setTodosPrecios(precios);

      if (precios.length > 0) {
        const valores = precios.map(p => p.preciocarga);
        const prom = Math.round(valores.reduce((a, b) => a + b, 0) / valores.length);
        setPrecioPromedio(prom);
        setPrecioMasAlto(Math.max(...valores));

        // Top 4 compradores ordenados por precio desc
        const top = [...precios]
          .sort((a, b) => b.preciocarga - a.preciocarga)
          .slice(0, 4)
          .map(p => ({
            nombre: p.comprador?.nombreempresa || 'Comprador',
            dist: p.comprador?.direccion || '—',
            precio: p.preciocarga,
            id: p.comprador?._id,
          }));
        setTopCompradores(top);
      }

      // 2. Clima — GET /api/clima (público)
      try {
        const climaRes = await axios.get(`${API_URL}/api/clima`);
        setClima(climaRes.data);
      } catch {
        // Fallback si el endpoint falla
        setClima({
          temperatura: 24, humedad: 68, lluvia: 0,
          descripcion: 'Parcialmente nublado · Bueno para secado',
          manana: 22, uv: 6,
        });
      }

      // 3. Alerta activa — GET /api/alertas/usuario/:id (requiere auth)
      if (usuario?.id) {
        try {
          const alertasRes = await axios.get(
            `${API_URL}/api/alertas/usuario/${usuario.id}`,
            { headers }
          );
          const alertas = alertasRes.data;
          if (alertas.length > 0) {
            const primera = alertas[0];
            setAlertaActiva(primera);
            // Soporta tanto 'precioObjetivo' como 'precio' según el modelo
            setAlertaPrecio(primera.precioObjetivo || primera.precio || 2000000);
          }
        } catch { /* sin alertas todavía, no es error */ }
      }

      // 4. Historial — GET /api/historial-precios (requiere auth)
      try {
        const histRes = await axios.get(`${API_URL}/api/historial-precios`, { headers });
        const datos = histRes.data;
        // Agrupa por fecha y calcula promedio diario
        const porFecha = {};
        datos.forEach(h => {
          const fecha = new Date(h.createdAt || h.fecha).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short'
          });
          if (!porFecha[fecha]) porFecha[fecha] = [];
          porFecha[fecha].push(h.preciocarga);
        });
        const grafica = Object.entries(porFecha)
          .slice(-10)
          .map(([label, vals]) => ({
            label,
            precio: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
          }));
        if (grafica.length > 0) {
          grafica[grafica.length - 1].label = 'Hoy';
          setHistorial(grafica);
        }
      } catch { /* sin historial aún */ }

      // 5. Noticias — GET /api/noticias (público)
      try {
        const noticiasRes = await axios.get(`${API_URL}/api/noticias`);
        setNoticias(noticiasRes.data.slice(0, 3));
      } catch { /* sin noticias */ }

    } catch (error) {
      console.error('Error cargando dashboard productor:', error);
    } finally {
      setCargando(false);
    }
  }, [API_URL, usuario?.id]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ─── Guardar / actualizar alerta ──────────────────────────────────
  const handleGuardarAlerta = async () => {
    setGuardandoAlerta(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (alertaActiva?._id) {
        // PUT /api/alertas/:id
        await axios.put(
          `${API_URL}/api/alertas/${alertaActiva._id}`,
          { precioObjetivo: alertaPrecio, precio: alertaPrecio },
          { headers }
        );
      } else {
        // POST /api/alertas
        const res = await axios.post(
          `${API_URL}/api/alertas`,
          { usuario: usuario?.id, precioObjetivo: alertaPrecio, precio: alertaPrecio, activa: true },
          { headers }
        );
        setAlertaActiva(res.data);
      }
      mostrarMsg('exito', '¡Alerta guardada correctamente!');
    } catch (error) {
      mostrarMsg('error', error.response?.data?.message || 'Error al guardar la alerta');
    } finally {
      setGuardandoAlerta(false);
    }
  };

  // ─── Datos derivados ──────────────────────────────────────────────
  const totalVenta = precioMasAlto * cargas;

  const datosGrafica = historial.length > 1 ? historial : [
    { label: "Feb 3",  precio: 1840000 },
    { label: "Feb 9",  precio: 1870000 },
    { label: "Feb 16", precio: 1900000 },
    { label: "Feb 23", precio: 1930000 },
    { label: "Mar 1",  precio: 1960000 },
    { label: "Mar 8",  precio: 1980000 },
    { label: "Hoy",    precio: precioMasAlto || 2020000 },
  ];

  const categoriaEmoji = {
    mercado: '📈', internacional: '🌎', clima: '🌧️',
    fnc: '🏛️', produccion: '🌱', consejos: '💡', el_pital: '⛰️',
  };

  const varPct = precioPromedio > 0 && precioFNC > 0
    ? (((precioPromedio - precioFNC) / precioFNC) * 100).toFixed(1)
    : 0;

  // ─── Loading ──────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="min-h-screen bg-[#F5ECD7] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">☕</div>
          <p className="text-[#8B7355] text-sm font-semibold">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5ECD7]">

      {/* Header */}
      <div className="bg-[#F5ECD7] px-6 md:px-8 py-5 flex items-center justify-between border-b border-[#E0D0B0] flex-wrap gap-3">
        <div>
          <h1 className="text-[#2C1A0E] text-2xl font-bold">Panel del Caficultor</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Bienvenido,{' '}
            <span className="text-[#C8A96E] font-semibold">
              {usuario?.nombre} {usuario?.apellido}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-300 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          <span className="text-green-700 text-xs font-semibold">En vivo</span>
        </div>
      </div>

      {/* Mensaje global */}
      {mensaje && (
        <div className={`mx-6 md:mx-8 mt-4 px-4 py-3 rounded-xl text-sm font-semibold ${
          mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
        </div>
      )}

      <div className="px-6 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ═══ Columna izquierda (2/3) ═══ */}
          <div className="lg:col-span-2 space-y-4">

            {/* Fila: precio + clima */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Precio promedio */}
              <div className="bg-[#2C1A0E] rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute right-4 bottom-4 opacity-10 text-8xl select-none pointer-events-none">☕</div>
                <p className="text-[#C8A96E] text-xs uppercase font-semibold tracking-wide mb-3">
                  🏪 Precio promedio hoy — Pitalito
                </p>
                <p className="text-[#F8F2E8] font-bold leading-none mb-2" style={{ fontSize: 36 }}>
                  {precioPromedio > 0 ? precioPromedio.toLocaleString('es-CO') : '---'}
                  <span className="text-[#D8C7A8] text-lg font-normal ml-2">COP / carga</span>
                </p>
                {Number(varPct) !== 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      Number(varPct) >= 0
                        ? 'bg-green-700 text-green-100'
                        : 'bg-red-800 text-red-100'
                    }`}>
                      {Number(varPct) >= 0 ? '▲' : '▼'} {Math.abs(varPct)}% vs FNC
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-[#3D2510]">
                  <div>
                    <p className="text-[#8B7355] text-xs">Precio más alto</p>
                    <p className="text-[#F8F2E8] text-sm font-bold mt-0.5">
                      {precioMasAlto > 0 ? precioMasAlto.toLocaleString('es-CO') : '---'} COP
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8B7355] text-xs">Precio FNC ref.</p>
                    <p className="text-[#F8F2E8] text-sm font-bold mt-0.5">
                      {precioFNC.toLocaleString('es-CO')} COP
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8B7355] text-xs">Compradores activos</p>
                    <p className="text-[#F8F2E8] text-sm font-bold mt-0.5">
                      {todosPrecios.length} cerca
                    </p>
                  </div>
                </div>
              </div>

              {/* Clima */}
              <div className="bg-[#1B3A4B] rounded-2xl p-6 shadow-sm text-white">
                <p className="text-blue-300 text-xs uppercase font-semibold tracking-wide mb-3">
                  🌤 Clima en tu zona
                </p>
                {clima ? (
                  <>
                    <div className="flex items-end gap-2 mb-1">
                      <span className="text-white font-bold" style={{ fontSize: 52, lineHeight: 1 }}>
                        {clima.temperatura ?? clima.temp ?? 24}°
                      </span>
                    </div>
                    <p className="text-blue-200 text-sm mb-4">
                      {clima.descripcion || 'Parcialmente nublado · Bueno para secado'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-blue-300 text-xs uppercase font-semibold">Humedad</p>
                        <p className="text-white text-xl font-bold mt-1">{clima.humedad ?? 68}%</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-blue-300 text-xs uppercase font-semibold">Lluvia hoy</p>
                        <p className="text-white text-xl font-bold mt-1">
                          {clima.lluvia ?? clima.precipitacion ?? 0} mm
                        </p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-blue-300 text-xs uppercase font-semibold">Mañana</p>
                        <p className="text-white text-xl font-bold mt-1">
                          🌧 {clima.manana ?? clima.tempManana ?? 22}°
                        </p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-blue-300 text-xs uppercase font-semibold">Índice UV</p>
                        <p className="text-white text-xl font-bold mt-1">
                          {clima.uv ?? clima.indiceUV ?? 6} · Alto
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-32 text-blue-300 text-sm">
                    Clima no disponible
                  </div>
                )}
              </div>
            </div>

            {/* Alerta de precio */}
            <div className="bg-[#F0F7E8] border border-green-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎯</span>
                <p className="text-green-700 text-xs uppercase font-bold tracking-wide">
                  {alertaActiva ? 'Mi alerta activa' : 'Crear alerta de precio'}
                </p>
              </div>
              <p className="text-[#2C1A0E] font-bold mb-1" style={{ fontSize: 32 }}>
                {alertaPrecio.toLocaleString('es-CO')}
              </p>
              <p className="text-gray-500 text-sm mb-4">
                Te avisamos cuando el precio supere este valor
              </p>
              <input
                type="range" min={1000000} max={3000000} step={10000}
                value={alertaPrecio}
                onChange={e => setAlertaPrecio(Number(e.target.value))}
                className="w-full accent-green-600 mb-2"
              />
              <div className="flex justify-between text-xs text-gray-400 mb-4">
                <span>1.000.000</span>
                <span>3.000.000</span>
              </div>
              <button
                onClick={handleGuardarAlerta}
                disabled={guardandoAlerta}
                className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                {guardandoAlerta ? 'Guardando...' : '✓ Guardar alerta'}
              </button>
            </div>

            {/* Gráfica tendencia */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <p className="text-[#2C1A0E] font-bold text-base">Tendencia del precio</p>
                <div className="flex gap-2">
                  {["7D", "30D", "90D", "1A"].map(r => (
                    <button key={r} onClick={() => setRangoGrafica(r)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        rangoGrafica === r
                          ? 'bg-[#2C1A0E] text-white'
                          : 'bg-[#F5ECD7] text-[#8B7355] hover:bg-[#E0D0B0]'
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={datosGrafica}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1E7D3" />
                    <XAxis dataKey="label" tick={{ fill: '#8B7355', fontSize: 11 }} />
                    <YAxis
                      tick={{ fill: '#8B7355', fontSize: 11 }}
                      tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip formatter={v => [`$${Number(v).toLocaleString('es-CO')}`, 'Precio']} />
                    <Line
                      type="monotone" dataKey="precio"
                      stroke="#C8A96E" strokeWidth={3}
                      dot={(props) => {
                        const { cx, cy, index } = props;
                        const esUltimo = index === datosGrafica.length - 1;
                        return (
                          <circle key={index} cx={cx} cy={cy}
                            r={esUltimo ? 6 : 3}
                            fill="#C8A96E"
                            stroke={esUltimo ? '#fff' : 'none'}
                            strokeWidth={esUltimo ? 2 : 0}
                          />
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {historial.length === 0 && (
                <p className="text-center text-xs text-gray-400 mt-2">
                  Mostrando datos de ejemplo — se actualizará con actividad real
                </p>
              )}
            </div>

            {/* Noticias */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#2C1A0E] font-bold text-sm">🗞 Noticias del sector</p>
                <Link to="/noticias" className="text-xs text-[#C8A96E] hover:underline">Ver todas →</Link>
              </div>
              {noticias.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">No hay noticias recientes</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {noticias.map((n, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="w-10 h-10 bg-[#F5ECD7] rounded-xl flex items-center justify-center text-xl">
                        {categoriaEmoji[n.categoria] || '📰'}
                      </div>
                      <p className="text-sm font-semibold text-[#2C1A0E] leading-snug">{n.titulo}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(n.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ═══ Columna derecha (1/3) ═══ */}
          <div className="space-y-4">

            {/* Mapa compradores */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[#2C1A0E] font-bold text-sm">📍 Compradores cerca</p>
                <Link to="/mapa" className="text-xs text-[#C8A96E] hover:underline">Ver mapa completo →</Link>
              </div>
              <div className="w-full h-36 rounded-xl bg-[#E8F0E0] relative overflow-hidden mb-3 border border-[#D4E4C4]">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 20px,
                    rgba(255,255,255,0.4) 20px, rgba(255,255,255,0.4) 21px),
                    repeating-linear-gradient(90deg, transparent, transparent 20px,
                    rgba(255,255,255,0.4) 20px, rgba(255,255,255,0.4) 21px)`
                }} />
                {[
                  { top: '20%', left: '30%' }, { top: '40%', left: '65%' },
                  { top: '60%', left: '20%' }, { top: '70%', left: '75%' },
                ].map((pos, i) => (
                  <div key={i}
                    className="absolute w-5 h-5 bg-[#C8A96E] rounded-full border-2 border-white shadow flex items-center justify-center"
                    style={{ top: pos.top, left: pos.left, transform: 'translate(-50%,-50%)' }}>
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                ))}
                <div className="absolute w-5 h-5 bg-green-600 rounded-full border-2 border-white shadow"
                  style={{ top: '48%', left: '47%', transform: 'translate(-50%,-50%)' }} />
                <div className="absolute bottom-2 left-2 flex gap-2">
                  <span className="flex items-center gap-1 text-[10px] text-gray-600 bg-white/80 px-2 py-0.5 rounded-full">
                    <span className="w-2 h-2 bg-[#C8A96E] rounded-full inline-block" />Compradores
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-600 bg-white/80 px-2 py-0.5 rounded-full">
                    <span className="w-2 h-2 bg-green-600 rounded-full inline-block" />Yo
                  </span>
                </div>
              </div>
            </div>

            {/* Mejores precios */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <p className="text-[#2C1A0E] font-bold text-sm mb-4">🏆 Mejores precios hoy</p>
              {topCompradores.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">No hay precios publicados aún</div>
              ) : (
                <div className="space-y-3">
                  {topCompradores.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-4 shrink-0 font-bold">{i + 1}</span>
                      <div className="w-8 h-8 bg-[#F5ECD7] rounded-lg flex items-center justify-center text-sm shrink-0">🏪</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#2C1A0E] truncate">{c.nombre}</p>
                        <p className="text-[10px] text-gray-400 truncate">📍 {c.dist}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-[#2C1A0E]">{c.precio.toLocaleString('es-CO')}</p>
                        <p className="text-[10px] text-gray-400">COP/carga</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/precios"
                className="block w-full text-center border border-[#E7D9BF] text-[#C8A96E] text-xs font-semibold py-2.5 rounded-xl mt-4 hover:bg-[#FFF8E7] transition-colors">
                Ver los {todosPrecios.length} compradores →
              </Link>
            </div>

            {/* Calculadora rápida */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <p className="text-[#2C1A0E] font-bold text-sm mb-1">🧮 Calculadora rápida</p>
              <p className="text-gray-400 text-xs mb-4">¿Cuánto recibirías si vendes hoy?</p>
              <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Cargas</label>
              <input
                type="number" min={1} max={999}
                value={cargas}
                onChange={e => setCargas(Math.max(1, Number(e.target.value)))}
                className="w-full px-4 py-3 rounded-xl border border-[#E7D9BF] text-sm focus:outline-none focus:border-[#C8A96E] bg-[#FDFAF5] mb-4"
              />
              <div className="bg-[#2C1A0E] rounded-xl p-4 flex items-center justify-between">
                <p className="text-[#D8C7A8] text-xs leading-tight">Con el mejor<br />precio</p>
                <p className="text-[#F8F2E8] text-lg font-bold">
                  ${totalVenta > 0 ? totalVenta.toLocaleString('es-CO') : '---'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}