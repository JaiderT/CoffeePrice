import { useState, useEffect, useCallback } from "react";
import { useAuth } from '../../context/useAuth.js';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix íconos Leaflet en Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const CENTRO_PITAL = [2.266205, -75.805401];

// Icono comprador para mini mapa
const crearIconoMini = (color = '#C8814A') => new L.DivIcon({
  className: '',
  html: `<div style="
    width:32px;height:32px;
    background:${color};
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    display:flex;align-items:center;justify-content:center;
    border:2px solid #FFF8EE;
    box-shadow:0 4px 10px rgba(44,26,14,0.25);
  ">
    <span style="font-size:14px;transform:rotate(45deg);">☕</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

// Componente para sincronizar tamaño
function SincronizarMapa() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize({ animate: false }), 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Mini mapa de compradores para el dashboard
function MiniMapaCompradores({ compradores, onVerMapa }) {
  return (
    <div className="bg-white rounded-[22px] p-5 shadow-[0_10px_30px_rgba(77,48,24,0.06)] border border-[#E7D9BF]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[#2C1A0E] font-bold text-sm">📍 Compradores cerca</p>
        <button
          onClick={onVerMapa}
          className="text-xs font-semibold text-[#C8A96E] transition-colors hover:text-[#A67C43]"
        >
          Ver mapa completo 
        </button>
      </div>

      {/* Mini mapa real con Leaflet */}
      <div className="w-full rounded-xl overflow-hidden mb-3 border border-[#D4E4C4]" style={{ height: 144, position: 'relative', zIndex: 0 }}>
        <MapContainer
          center={CENTRO_PITAL}
          zoom={14}
          zoomControl={false}
          scrollWheelZoom={false}
          doubleClickZoom={true}
          dragging={true}
          attributionControl={false}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <SincronizarMapa />
          {compradores.slice(0, 8).map((c, i) => {
            const colores = ['#C8814A', '#B7791F', '#7A4020', '#C8A96E'];
            return (
              <Marker
                key={c._id || i}
                position={[c.latitud, c.longitud]}
                icon={crearIconoMini(colores[i % colores.length])}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-[#3B1F0A]">{c.nombreempresa}</p>
                    {c.precioReferencia > 0 && (
                      <p className="text-[#C8814A] font-semibold">${c.precioReferencia.toLocaleString()}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Overlay leyenda */}
        <div className="absolute bottom-2 left-2 z-400 flex gap-2 pointer-events-none">
          <span className="flex items-center gap-1 text-[10px] text-gray-600 bg-white/90 px-2 py-0.5 rounded-full shadow-sm">
            <span className="w-2 h-2 bg-[#C8A96E] rounded-full inline-block" />Compradores
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardProductor() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [mensaje, setMensaje] = useState(null);

  const [cargandoPrecios, setCargandoPrecios]     = useState(true);
  const [cargandoClima, setCargandoClima]         = useState(true);
  const [cargandoAlerta, setCargandoAlerta]       = useState(true);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [cargandoNoticias, setCargandoNoticias]   = useState(true);
  const [cargandoFNC, setCargandoFNC]             = useState(true);
  const [cargandoCompradores, setCargandoCompradores] = useState(true);

  const [precioMasAlto, setPrecioMasAlto]   = useState(0);
  const [precioFNC, setPrecioFNC]           = useState(null);
  const [fuenteFNC, setFuenteFNC]           = useState(null);
  const [topCompradores, setTopCompradores] = useState([]);
  const [totalCompradores, setTotalCompradores] = useState(0);
  const [compradoresMapa, setCompradoresMapa] = useState([]);

  const [clima, setClima] = useState(null);

  const [alertaActiva, setAlertaActiva]       = useState(null);
  const [alertaPrecio, setAlertaPrecio]       = useState(2000000);
  const [guardandoAlerta, setGuardandoAlerta] = useState(false);

  const [historial, setHistorial]       = useState([]);
  const [rangoGrafica, setRangoGrafica] = useState("30D");

  const [noticias, setNoticias] = useState([]);
  const [cargas, setCargas]     = useState(3);

  const mostrarMsg = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3500);
  };

  const cargarPrecios = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/precios`);
      const precios = res.data;
      if (precios.length > 0) {
        setPrecioMasAlto(Math.max(...precios.map(p => p.preciocarga)));
        const idsUnicos = new Set(precios.map(p => p.comprador?._id).filter(Boolean));
        setTotalCompradores(idsUnicos.size);
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
    } catch {
      // silencioso
    }
    finally { setCargandoPrecios(false); }
  }, [API_URL]);

  const cargarPrecioFNC = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/precio-fnc`);
      if (res.data?.precio) {
        setPrecioFNC(res.data.precio);
        setFuenteFNC(res.data.fuente);
      }
    } catch (err) {
      console.error("Error precioFNC:", err.response?.status, err.message);
    } finally {
      setCargandoFNC(false);
    }
  }, [API_URL]);

  const cargarClima = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/clima`);
      setClima(res.data);
    } catch {
      setClima({
        actual: { temperatura: 24, humedad: 68, lluvia: 0, descripcion: 'Parcialmente nublado · Bueno para secado', icono: '⛅' },
        pronostico: [],
      });
    } finally { setCargandoClima(false); }
  }, [API_URL]);

  const obtenerRecomendacionClima = () => {
    if (!clima?.actual) return 'Consulta el clima antes de mover o secar café.';
    if (clima.actual.resumen) return clima.actual.resumen;
    const { lluvia, humedad, descripcion, viento } = clima.actual;
    if (lluvia >= 5) return 'Se esperan lluvias fuertes. Protege el café.';
    if (lluvia > 0 || descripcion?.toLowerCase().includes('lluvia')) return 'Puede llover durante la jornada. Mantén el café cubierto.';
    if (humedad >= 80) return 'La humedad está alta. Ten cuidado con el secado.';
    if (viento >= 20) return 'Hay bastante viento. Revisa lonas y cubiertas.';
    return 'El clima se ve estable para la jornada.';
  };

  const normalizarFecha = (fecha) => {
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) return new Date(`${fecha}T12:00:00`);
    return new Date(fecha);
  };

  const formatearDiaCorto = (fecha) =>
    normalizarFecha(fecha).toLocaleDateString('es-CO', { weekday: 'short' });

  const cargarAlerta = useCallback(async () => {
    if (!usuario?.id) { setCargandoAlerta(false); return; }
    try {
      const res = await axios.get(`${API_URL}/api/alertas/usuario/${usuario.id}`, { withCredentials: true });
      const alertas = res.data;
      if (Array.isArray(alertas) && alertas.length > 0) {
        setAlertaActiva(alertas[0]);
        setAlertaPrecio(alertas[0].precioMinimo ?? 2000000);
      }
    } catch {
      // silencioso
    }
    finally { setCargandoAlerta(false); }
  }, [API_URL, usuario?.id]);

  const cargarHistorial = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/historial-precios`, { withCredentials: true });
      const datos = res.data;
      if (Array.isArray(datos) && datos.length > 0) {
        const porFecha = {};
        datos.forEach(p => {
          const raw = p.updatedAt || p.createdAt || p.fecha;
          if (!raw) return;
          const fechaBase = new Date(raw);
          if (Number.isNaN(fechaBase.getTime())) return;
          const fechaKey = fechaBase.toISOString().slice(0, 10);
          if (!porFecha[fechaKey]) porFecha[fechaKey] = [];
          porFecha[fechaKey].push(p.preciocarga);
        });
        const grafica = Object.entries(porFecha)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([label, vals]) => ({
            fecha: label,
            precio: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
          }));
        setHistorial(grafica);
      }
    } catch {
      // silencioso
    } finally {
      setCargandoHistorial(false);
    }
  }, [API_URL]);

  const cargarNoticias = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/noticias`);
      setNoticias(res.data.slice(0, 3));
    } catch {
      // silencioso
    }
    finally { setCargandoNoticias(false); }
  }, [API_URL]);

  // Cargar compradores para el mini mapa
  const cargarCompradoresMapa = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/comprador/mapa`, { withCredentials: true });
      const normalizados = (res.data || []).filter(
        c => Number.isFinite(c.latitud) && Number.isFinite(c.longitud)
      );
      setCompradoresMapa(normalizados);
    } catch {
      // silencioso
    } finally {
      setCargandoCompradores(false);
    }
  }, [API_URL]);

  useEffect(() => {
    cargarPrecios();
    cargarClima();
    cargarAlerta();
    cargarHistorial();
    cargarNoticias();
    cargarPrecioFNC();
    cargarCompradoresMapa();
  }, [cargarPrecios, cargarClima, cargarAlerta, cargarHistorial, cargarNoticias, cargarPrecioFNC, cargarCompradoresMapa]);

  const handleGuardarAlerta = async () => {
    if (!usuario?.id) return;
    setGuardandoAlerta(true);
    try {
      const config = { withCredentials: true };
      if (alertaActiva?._id) {
        await axios.put(`${API_URL}/api/alertas/${alertaActiva._id}`, { precioMinimo: alertaPrecio }, config);
      } else {
        const res = await axios.post(`${API_URL}/api/alertas`, {
          usuario: usuario.id, precioMinimo: alertaPrecio, activa: true,
          canales: { whatsapp: true, push: true, sms: false, email: true },
        }, config);
        setAlertaActiva(res.data);
      }
      mostrarMsg('exito', '¡Alerta guardada correctamente!');
    } catch (error) {
      mostrarMsg('error', error.response?.data?.message || 'Error al guardar la alerta');
    } finally { setGuardandoAlerta(false); }
  };

  const totalVenta = precioMasAlto * cargas;

  const diasPorRango = {
    "7D": 7,
    "30D": 30,
    "90D": 90,
    "1A": 365,
  };

  const datosHistorialFiltrados = historial.filter((item) => {
    const dias = diasPorRango[rangoGrafica] || 30;
    const fecha = new Date(`${item.fecha}T12:00:00`);
    if (Number.isNaN(fecha.getTime())) return false;
    const diffDias = Math.floor((Date.now() - fecha.getTime()) / 86400000);
    return diffDias <= dias;
  });

  const datosGrafica = datosHistorialFiltrados.length > 1 ? datosHistorialFiltrados.map((item, index, array) => ({
    label: index === array.length - 1
      ? 'Hoy'
      : new Date(`${item.fecha}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
    precio: item.precio,
  })) : [
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

  const varPct = precioMasAlto > 0 && precioFNC > 0
    ? (((precioMasAlto - precioFNC) / precioFNC) * 100).toFixed(1)
    : 0;

  const SkeletonBox = ({ h = 'h-52', extra = '' }) => (
    <div className={`${h} bg-gradient-to-br from-[#F8F1E2] to-[#EFE3CC] rounded-[22px] border border-[#E7D9BF]/70 animate-pulse ${extra}`} />
  );

  return (
    <div className="min-h-screen bg-[#F5ECD7]">

      {/* Header */}
      <div className="bg-[#F5ECD7] px-5 md:px-8 py-5 md:py-6 flex items-center justify-between border-b border-[#E0D0B0] flex-wrap gap-3">
        <div>
          <h1 className="text-[#2C1A0E] text-2xl md:text-[2rem] font-black tracking-tight">Panel del Caficultor</h1>
          <p className="text-gray-500 text-sm mt-1">
            Bienvenido,{' '}
            <span className="text-[#C8A96E] font-semibold">{usuario?.nombre} {usuario?.apellido}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-300 px-3 py-1.5 rounded-full shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          <span className="text-green-700 text-xs font-semibold">En vivo</span>
        </div>
      </div>

      {mensaje && (
        <div className={`mx-5 md:mx-8 mt-4 px-4 py-3 rounded-2xl border text-sm font-semibold shadow-sm ${
          mensaje.tipo === 'exito' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
        </div>
      )}

      <div className="px-5 md:px-8 py-5 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ═══ Columna izquierda (2/3) ═══ */}
          <div className="lg:col-span-2 space-y-4">

            {/* Fila: precio FNC + clima */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Tarjeta Precio FNC */}
              {cargandoFNC ? <SkeletonBox /> : (
                <div className="bg-[#2C1A0E] rounded-[26px] p-5 md:p-6 shadow-[0_16px_36px_rgba(44,26,14,0.18)] relative overflow-hidden">
                  <div className="absolute right-4 bottom-4 opacity-10 text-8xl select-none pointer-events-none">☕</div>
                  <p className="text-[#C8A96E] text-xs uppercase font-semibold tracking-[0.22em] mb-3">
                    🏛️ Precio FNC hoy
                  </p>
                  <p className="text-[#F8F2E8] font-black leading-none tracking-tight mb-2" style={{ fontSize: 36 }}>
                    {precioFNC ? precioFNC.toLocaleString('es-CO') : '---'}
                    <span className="text-[#D8C7A8] text-lg font-normal ml-2">COP / carga</span>
                  </p>

                  <div className="flex items-center gap-2 mt-2 mb-3">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shadow-sm ${
                      fuenteFNC === 'fnc-directo'
                        ? 'bg-green-700 text-green-100'
                        : 'bg-yellow-700 text-yellow-100'
                    }`}>
                      {fuenteFNC === 'fnc-directo' ? '● Fuente: FNC directa' : '● Fuente: estimado NY'}
                    </span>
                  </div>

                  {Number(varPct) !== 0 && (
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className={`text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm ${
                        Number(varPct) >= 0 ? 'bg-green-700 text-green-100' : 'bg-red-800 text-red-100'
                      }`}>
                        {Number(varPct) >= 0 ? '▲' : '▼'} {Math.abs(varPct)}% precio local vs FNC
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 mt-5 pt-4 border-t border-[#3D2510]">
                    <div>
                      <p className="text-[#8B7355] text-xl1">Precio más alto local</p>
                      <p className="text-[#F8F2E8] text-xl1 font-bold mt-0.5">
                        {precioMasAlto > 0 ? precioMasAlto.toLocaleString('es-CO') : '---'} COP
                      </p>
                    </div>
                    <div />
                  </div>
                </div>
              )}

              {/* Clima */}
              {cargandoClima ? <SkeletonBox extra="bg-[#1B3A4B]/20" /> : (
                <div className="bg-[#1B3A4B] rounded-[26px] p-5 md:p-6 shadow-[0_16px_36px_rgba(27,58,75,0.18)] text-white">
                  <p className="text-blue-300 text-xs uppercase font-semibold tracking-[0.22em] mb-3">
                    🌤 Clima en tu zona
                  </p>
                  {clima?.actual ? (
                    <>
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
                      <p className="text-blue-100 text-xs md:text-[13px] mt-3 mb-4 leading-relaxed">
                        {obtenerRecomendacionClima()}
                      </p>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/10 rounded-2xl border border-white/5 p-3">
                          <p className="text-blue-300 text-xs uppercase font-semibold">Humedad</p>
                          <p className="text-white text-xl font-bold mt-1">{clima.actual.humedad ?? 68}%</p>
                        </div>
                        <div className="bg-white/10 rounded-2xl border border-white/5 p-3">
                          <p className="text-blue-300 text-xs uppercase font-semibold">Lluvia hoy</p>
                          <p className="text-white text-xl font-bold mt-1">
                            {clima.actual.lluvia ?? clima.actual.precipitacion ?? 0} mm
                          </p>
                        </div>
                      </div>
                      {clima.pronostico?.length > 0 && (
                        <div>
                          <p className="text-blue-300 text-xs uppercase font-semibold mb-2">Próximos días</p>
                          <div className="flex gap-2 flex-wrap">
                            {clima.pronostico.slice(0, 4).map((dia) => (
                              <div key={dia.fecha}
                                className="flex flex-col items-center gap-1 bg-white/10 rounded-2xl border border-white/5 px-3 py-2"
                                title={dia.descripcion}>
                                <span className="text-[10px] text-blue-300 capitalize">{formatearDiaCorto(dia.fecha)}</span>
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
              <div className="bg-[#F0F7E8] border border-green-200 rounded-[22px] p-5 shadow-[0_10px_30px_rgba(76,118,56,0.07)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <p className="text-green-700 text-xs uppercase font-bold tracking-wide">
                      {alertaActiva ? 'Mi alerta activa' : 'Crear alerta de precio'}
                    </p>
                  </div>
                  {alertaActiva && (
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                      alertaActiva.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {alertaActiva.activa ? '● Activa' : '○ Inactiva'}
                    </span>
                  )}
                </div>
                <p className="text-[#2C1A0E] font-black tracking-tight mb-1" style={{ fontSize: 32 }}>
                  {alertaPrecio.toLocaleString('es-CO')}
                </p>
                <p className="text-gray-500 text-sm mb-4">Te avisamos cuando el precio supere este valor</p>
                <input
                  type="range" min={1000000} max={3000000} step={10000}
                  value={alertaPrecio}
                  onChange={e => setAlertaPrecio(Number(e.target.value))}
                  className="w-full accent-green-600 mb-2"
                />
                <div className="flex justify-between text-xs text-gray-400 mb-4">
                  <span>1.000.000</span><span>3.000.000</span>
                </div>
                {alertaActiva && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {alertaActiva.canales?.whatsapp && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-lg font-semibold">📱 WhatsApp</span>
                    )}
                    {alertaActiva.canales?.push && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-lg font-semibold">🔔 Push</span>
                    )}
                    {alertaActiva.canales?.email && (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-lg font-semibold">✉️ Email</span>
                    )}
                  </div>
                )}
                <button
                  onClick={handleGuardarAlerta} disabled={guardandoAlerta}
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
              <div className="bg-white rounded-[22px] p-5 shadow-[0_10px_30px_rgba(77,48,24,0.06)] border border-[#E7D9BF]">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <p className="text-[#2C1A0E] font-bold tracking-tight text-base">Tendencia del precio</p>
                  <div className="flex gap-2">
                    {["7D", "30D", "90D", "1A"].map(r => (
                      <button key={r} onClick={() => setRangoGrafica(r)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          rangoGrafica === r ? 'bg-[#2C1A0E] text-white' : 'bg-[#F5ECD7] text-[#8B7355] hover:bg-[#E0D0B0]'
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
                        type="monotone" dataKey="precio" stroke="#C8A96E" strokeWidth={3}
                        dot={(props) => {
                          const { cx, cy, index } = props;
                          const esUltimo = index === datosGrafica.length - 1;
                          return (
                            <circle key={index} cx={cx} cy={cy}
                              r={esUltimo ? 6 : 3} fill="#C8A96E"
                              stroke={esUltimo ? '#fff' : 'none'}
                              strokeWidth={esUltimo ? 2 : 0}
                            />
                          );
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {datosHistorialFiltrados.length === 0 && (
                  <p className="text-center text-xs text-gray-400 mt-2">
                    Mostrando datos de ejemplo — se actualizará con actividad real
                  </p>
                )}
              </div>
            )}

            {/* Noticias */}
            {cargandoNoticias ? <SkeletonBox h="h-32" extra="bg-white border border-[#E7D9BF]" /> : (
              <div className="bg-white rounded-[22px] p-5 shadow-[0_10px_30px_rgba(77,48,24,0.06)] border border-[#E7D9BF]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[#2C1A0E] font-bold text-sm">🗞 Noticias del sector</p>
                  <Link to="/noticias" className="text-xs text-[#C8A96E] hover:underline">Ver todas →</Link>
                </div>
                {noticias.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm rounded-2xl border border-dashed border-[#E7D9BF] bg-[#FCF8F1]">No hay noticias recientes</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {noticias.map((n, i) => (
                      <div key={i} className="flex flex-col gap-2 rounded-2xl border border-[#EFE3CD] bg-[#FFFCF7] p-4 transition-colors hover:bg-[#FFF7EA]">
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
            )}
          </div>

          {/* ═══ Columna derecha (1/3) ═══ */}
          <div className="space-y-4">

            {/* Mini mapa real de compradores */}
            {cargandoCompradores ? (
              <SkeletonBox extra="bg-white border border-[#E7D9BF]" h="h-52" />
            ) : (
              <MiniMapaCompradores
                compradores={compradoresMapa}
                onVerMapa={() => navigate('/mapa')}
              />
            )}

            {/* Mejores precios hoy */}
            {cargandoPrecios ? <SkeletonBox extra="bg-white border border-[#E7D9BF]" /> : (
              <div className="bg-white rounded-[22px] p-5 shadow-[0_10px_30px_rgba(77,48,24,0.06)] border border-[#E7D9BF]">
                <p className="text-[#2C1A0E] font-bold text-sm mb-4">🏆 Mejores precios hoy</p>
                {topCompradores.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm rounded-2xl border border-dashed border-[#E7D9BF] bg-[#FCF8F1]">No hay precios publicados aún</div>
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
                  Ver los {totalCompradores} compradores →
                </Link>
              </div>
            )}

            {/* Calculadora rápida */}
            <div className="bg-white rounded-[22px] p-5 shadow-[0_10px_30px_rgba(77,48,24,0.06)] border border-[#E7D9BF]">
              <p className="text-[#2C1A0E] font-bold text-sm mb-1">🧮 Calculadora rápida</p>
              <p className="text-gray-400 text-xs mb-4">¿Cuánto recibirías si vendes hoy?</p>
              <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Cargas</label>
              <input
                type="number" min={1} max={999} value={cargas}
                onChange={e => setCargas(Math.max(1, Number(e.target.value)))}
                className="w-full px-4 py-3 rounded-xl border border-[#E7D9BF] text-sm focus:outline-none focus:border-[#C8A96E] bg-[#FDFAF5] mb-4"
              />
              <div className="bg-[#2C1A0E] rounded-2xl p-4 flex items-center justify-between shadow-[0_10px_24px_rgba(44,26,14,0.14)]">
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
