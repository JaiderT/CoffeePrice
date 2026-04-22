import { useState, useEffect, useCallback } from "react";
import { useAuth } from '../../context/useAuth.js';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DashboardProductor() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario } = useAuth();

  // ─── Estado ───────────────────────────────────────────────────────
  const [mensaje, setMensaje] = useState(null);

  // Estados de carga individuales por sección
  const [cargandoPrecios, setCargandoPrecios]   = useState(true);
  const [cargandoClima, setCargandoClima]       = useState(true);
  const [cargandoAlerta, setCargandoAlerta]     = useState(true);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [cargandoNoticias, setCargandoNoticias] = useState(true);

  // Precios
  const [todosPrecios, setTodosPrecios]       = useState([]);
  const [precioPromedio, setPrecioPromedio]   = useState(0);
  const [precioMasAlto, setPrecioMasAlto]     = useState(0);
  const [precioFNC]                           = useState(1890000);
  const [topCompradores, setTopCompradores]   = useState([]);

  // Clima
  const [clima, setClima] = useState(null);

  // Alertas — campo correcto del modelo: precioMinimo
  const [alertaActiva, setAlertaActiva]       = useState(null);
  const [alertaPrecio, setAlertaPrecio]       = useState(2000000);
  const [guardandoAlerta, setGuardandoAlerta] = useState(false);

  // Historial / gráfica
  const [historial, setHistorial]             = useState([]);
  const [rangoGrafica, setRangoGrafica]       = useState("30D");

  // Noticias
  const [noticias, setNoticias]               = useState([]);

  // Calculadora
  const [cargas, setCargas]                   = useState(3);

  // ─── Helper mensajes ──────────────────────────────────────────────
  const mostrarMsg = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3500);
  };

  // ─── Carga independiente por sección ─────────────────────────────
  // Cada sección carga y muestra sus datos en cuanto estén listos,
  // sin esperar a las demás.

  const cargarPrecios = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/precios`);
      const precios = res.data;
      setTodosPrecios(precios);
      if (precios.length > 0) {
        const valores = precios.map(p => p.preciocarga);
        setPrecioPromedio(Math.round(valores.reduce((a, b) => a + b, 0) / valores.length));
        setPrecioMasAlto(Math.max(...valores));
        setTopCompradores(
          [...precios]
            .sort((a, b) => b.preciocarga - a.preciocarga)
            .slice(0, 4)
            .map(p => ({
              nombre: p.comprador?.nombreempresa || 'Comprador',
              dist:   p.comprador?.direccion     || '—',
              precio: p.preciocarga,
              id:     p.comprador?._id,
            }))
        );
      }
    } catch (_) {
      // silencioso — los datos quedan vacíos
    } finally {
      setCargandoPrecios(false);
    }
  }, [API_URL]);

  const cargarClima = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/clima`);
      setClima(res.data);
    } catch (_) {
      // Fallback con estructura compatible a clima.actual
      setClima({
        actual: {
          temperatura: 24, humedad: 68, lluvia: 0,
          descripcion: 'Parcialmente nublado · Bueno para secado',
          icono: '⛅',
        },
        pronostico: [],
      });
    } finally {
      setCargandoClima(false);
    }
  }, [API_URL]);

  // ─── Recomendación clima (igual que en Precios.jsx) ───────────────
  const obtenerRecomendacionClima = () => {
    if (!clima?.actual) return 'Consulta el clima antes de mover o secar café.';
    if (clima.actual.resumen) return clima.actual.resumen;
    const { lluvia, humedad, descripcion, viento } = clima.actual;
    if (lluvia >= 5) return 'Se esperan lluvias fuertes. Protege el café.';
    if (lluvia > 0 || descripcion?.toLowerCase().includes('lluvia'))
      return 'Puede llover durante la jornada. Mantén el café cubierto.';
    if (humedad >= 80) return 'La humedad está alta. Ten cuidado con el secado.';
    if (viento >= 20) return 'Hay bastante viento. Revisa lonas y cubiertas.';
    return 'El clima se ve estable para la jornada.';
  };

  const normalizarFecha = (fecha) => {
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha))
      return new Date(`${fecha}T12:00:00`);
    return new Date(fecha);
  };

  const formatearDiaCorto = (fecha) =>
    normalizarFecha(fecha).toLocaleDateString('es-CO', { weekday: 'short' });

  const cargarAlerta = useCallback(async () => {
    if (!usuario?.id) { setCargandoAlerta(false); return; }
    try {
      const token   = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/api/alertas/usuario/${usuario.id}`, { headers });
      const alertas = res.data;
      if (Array.isArray(alertas) && alertas.length > 0) {
        const primera = alertas[0];
        setAlertaActiva(primera);
        setAlertaPrecio(primera.precioMinimo ?? 2000000);
      }
    } catch (_) {
      // silencioso
    } finally {
      setCargandoAlerta(false);
    }
  }, [API_URL, usuario?.id]);

  const cargarHistorial = useCallback(async () => {
    if (!usuario?.id) { setCargandoHistorial(false); return; }
    try {
      const token   = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/api/historial-precios`, { headers });
      const datos = res.data;
      if (Array.isArray(datos) && datos.length > 0) {
        const porFecha = {};
        datos.forEach(h => {
          const fecha = new Date(h.createdAt || h.fecha).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short',
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
      }
    } catch (_) {
      // silencioso
    } finally {
      setCargandoHistorial(false);
    }
  }, [API_URL, usuario?.id]);

  const cargarNoticias = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/noticias`);
      setNoticias(res.data.slice(0, 3));
    } catch (_) {
      // silencioso
    } finally {
      setCargandoNoticias(false);
    }
  }, [API_URL]);

  // Lanza todas las cargas en paralelo al montar
  useEffect(() => {
    cargarPrecios();
    cargarClima();
    cargarAlerta();
    cargarHistorial();
    cargarNoticias();
  }, [cargarPrecios, cargarClima, cargarAlerta, cargarHistorial, cargarNoticias]);

  // ─── Guardar / actualizar alerta ──────────────────────────────────
  const handleGuardarAlerta = async () => {
    if (!usuario?.id) return;
    setGuardandoAlerta(true);
    try {
      const token   = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (alertaActiva?._id) {
        await axios.put(
          `${API_URL}/api/alertas/${alertaActiva._id}`,
          { precioMinimo: alertaPrecio },
          { headers }
        );
      } else {
        const res = await axios.post(
          `${API_URL}/api/alertas`,
          {
            usuario:      usuario.id,
            precioMinimo: alertaPrecio,
            activa:       true,
            canales:      { whatsapp: true, push: true, sms: false, email: false },
          },
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

  // ─── Helpers de skeleton ──────────────────────────────────────────
  const SkeletonBox = ({ h = 'h-52', extra = '' }) => (
    <div className={`${h} bg-[#2C1A0E]/10 rounded-2xl animate-pulse ${extra}`} />
  );

  // ─── Render principal ─────────────────────────────────────────────
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
              {cargandoPrecios ? <SkeletonBox /> : (
                <div className="bg-[#2C1A0E] rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute right-4 bottom-4 opacity-10 text-8xl select-none pointer-events-none">☕</div>
                  <p className="text-[#C8A96E] text-xs uppercase font-semibold tracking-wide mb-3">
                    🏪 Precio promedio hoy — Pital
                  </p>
                  <p className="text-[#F8F2E8] font-bold leading-none mb-2" style={{ fontSize: 36 }}>
                    {precioPromedio > 0 ? precioPromedio.toLocaleString('es-CO') : '---'}
                    <span className="text-[#D8C7A8] text-lg font-normal ml-2">COP / carga</span>
                  </p>
                  {Number(varPct) !== 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        Number(varPct) >= 0 ? 'bg-green-700 text-green-100' : 'bg-red-800 text-red-100'
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
              )}

              {/* Clima */}
              {cargandoClima ? <SkeletonBox extra="bg-[#1B3A4B]/20" /> : (
                <div className="bg-[#1B3A4B] rounded-2xl p-6 shadow-sm text-white">
                  <p className="text-blue-300 text-xs uppercase font-semibold tracking-wide mb-3">
                    🌤 Clima en tu zona
                  </p>
                  {clima?.actual ? (
                    <>
                      {/* Icono + temperatura + descripción */}
                      <div className="flex items-center gap-4 mb-1">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl shrink-0">
                          {clima.actual.icono || '⛅'}
                        </div>
                        <div>
                          <p className="text-white font-bold" style={{ fontSize: 36, lineHeight: 1 }}>
                            {Math.round(clima.actual.temperatura ?? 24)}°C
                          </p>
                          <p className="text-blue-200 text-sm mt-1">
                            {clima.actual.descripcion || 'Parcialmente nublado'}
                          </p>
                        </div>
                      </div>

                      {/* Recomendación */}
                      <p className="text-blue-100 text-xs mt-3 mb-4 leading-relaxed">
                        {obtenerRecomendacionClima()}
                      </p>

                      {/* Humedad + lluvia */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/10 rounded-xl p-3">
                          <p className="text-blue-300 text-xs uppercase font-semibold">Humedad</p>
                          <p className="text-white text-xl font-bold mt-1">
                            {clima.actual.humedad ?? 68}%
                          </p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3">
                          <p className="text-blue-300 text-xs uppercase font-semibold">Lluvia hoy</p>
                          <p className="text-white text-xl font-bold mt-1">
                            {clima.actual.lluvia ?? clima.actual.precipitacion ?? 0} mm
                          </p>
                        </div>
                      </div>

                      {/* Pronóstico próximos días */}
                      {clima.pronostico?.length > 0 && (
                        <div>
                          <p className="text-blue-300 text-xs uppercase font-semibold mb-2">
                            Próximos días
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {clima.pronostico.slice(0, 4).map((dia) => (
                              <div
                                key={dia.fecha}
                                className="flex flex-col items-center gap-1 bg-white/10 rounded-xl px-3 py-2"
                                title={dia.descripcion}
                              >
                                <span className="text-[10px] text-blue-300 capitalize">
                                  {formatearDiaCorto(dia.fecha)}
                                </span>
                                <span className="text-xl">{dia.icono || '🌤️'}</span>
                                <span className="text-white text-xs font-bold">
                                  {Math.round(dia.temperatura ?? dia.tempMax ?? 22)}°
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-blue-300 text-sm">
                      Clima no disponible
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Alerta de precio */}
            {cargandoAlerta ? <SkeletonBox h="h-40" extra="bg-green-100" /> : (
              <div className="bg-[#F0F7E8] border border-green-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <p className="text-green-700 text-xs uppercase font-bold tracking-wide">
                      {alertaActiva ? 'Mi alerta activa' : 'Crear alerta de precio'}
                    </p>
                  </div>
                  {alertaActiva && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      alertaActiva.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {alertaActiva.activa ? '● Activa' : '○ Inactiva'}
                    </span>
                  )}
                </div>
                <p className="text-[#2C1A0E] font-bold mb-1" style={{ fontSize: 32 }}>
                  {alertaPrecio.toLocaleString('es-CO')}
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  Te avisamos cuando el precio supere este valor
                </p>
                <input
                  type="range"
                  min={1000000} max={3000000} step={10000}
                  value={alertaPrecio}
                  onChange={e => setAlertaPrecio(Number(e.target.value))}
                  className="w-full accent-green-600 mb-2"
                />
                <div className="flex justify-between text-xs text-gray-400 mb-4">
                  <span>1.000.000</span>
                  <span>3.000.000</span>
                </div>

                {alertaActiva && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {alertaActiva.canales?.whatsapp && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-lg font-semibold">
                        📱 WhatsApp
                      </span>
                    )}
                    {alertaActiva.canales?.push && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-lg font-semibold">
                        🔔 Push
                      </span>
                    )}
                    {alertaActiva.canales?.email && (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-lg font-semibold">
                        ✉️ Email
                      </span>
                    )}
                  </div>
                )}

                <button
                  onClick={handleGuardarAlerta}
                  disabled={guardandoAlerta}
                  className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  {guardandoAlerta ? 'Guardando...' : '✓ Guardar alerta'}
                </button>

                <Link to="/alertas" className="block text-center text-xs text-green-700 hover:underline mt-3">
                  Gestionar todas mis alertas →
                </Link>
              </div>
            )}

            {/* Gráfica tendencia */}
            {cargandoHistorial ? <SkeletonBox h="h-64" extra="bg-white border border-[#E7D9BF]" /> : (
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
            )}

            {/* Noticias */}
            {cargandoNoticias ? <SkeletonBox h="h-32" extra="bg-white border border-[#E7D9BF]" /> : (
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
                          {new Date(n.createdAt).toLocaleDateString('es-CO', {
                            day: '2-digit', month: 'short',
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══ Columna derecha (1/3) ═══ */}
          <div className="space-y-4">

            {/* Mapa compradores — no depende de API, se muestra de inmediato */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[#2C1A0E] font-bold text-sm">📍 Compradores cerca</p>
                <Link to="/mapa" className="text-xs text-[#C8A96E] hover:underline">
                  Ver mapa completo →
                </Link>
              </div>
              <div className="w-full h-36 rounded-xl bg-[#E8F0E0] relative overflow-hidden mb-3 border border-[#D4E4C4]">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 20px,
                    rgba(255,255,255,0.4) 20px, rgba(255,255,255,0.4) 21px),
                    repeating-linear-gradient(90deg, transparent, transparent 20px,
                    rgba(255,255,255,0.4) 20px, rgba(255,255,255,0.4) 21px)`
                }} />
                {[
                  { top: '20%', left: '30%' },
                  { top: '40%', left: '65%' },
                  { top: '60%', left: '20%' },
                  { top: '70%', left: '75%' },
                ].map((pos, i) => (
                  <div key={i}
                    className="absolute w-5 h-5 bg-[#C8A96E] rounded-full border-2 border-white shadow flex items-center justify-center"
                    style={{ top: pos.top, left: pos.left, transform: 'translate(-50%,-50%)' }}>
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                ))}
                <div
                  className="absolute w-5 h-5 bg-green-600 rounded-full border-2 border-white shadow"
                  style={{ top: '48%', left: '47%', transform: 'translate(-50%,-50%)' }}
                />
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

            {/* Mejores precios hoy */}
            {cargandoPrecios ? <SkeletonBox extra="bg-white border border-[#E7D9BF]" /> : (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E7D9BF]">
                <p className="text-[#2C1A0E] font-bold text-sm mb-4">🏆 Mejores precios hoy</p>
                {topCompradores.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    No hay precios publicados aún
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topCompradores.map((c, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-4 shrink-0 font-bold">{i + 1}</span>
                        <div className="w-8 h-8 bg-[#F5ECD7] rounded-lg flex items-center justify-center text-sm shrink-0">
                          🏪
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#2C1A0E] truncate">{c.nombre}</p>
                          <p className="text-[10px] text-gray-400 truncate">📍 {c.dist}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-[#2C1A0E]">
                            {c.precio.toLocaleString('es-CO')}
                          </p>
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
            )}

            {/* Calculadora rápida — no depende de API */}
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
                <p className="text-[#D8C7A8] text-xs leading-tight">
                  Con el mejor<br />precio
                </p>
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