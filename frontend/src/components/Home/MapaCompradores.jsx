import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const CENTRO_PITAL = [2.266205, -75.805401];
const ZOOM_INICIAL = 15;
const MAX_BOUNDS = L.latLngBounds([2.259, -75.812], [2.273, -75.798]);

const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const radio = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radio * c;
};

const obtenerTipoVisual = (tipoempresa = '', nombre = '') => {
  const texto = `${tipoempresa} ${nombre}`.toLowerCase();

  if (texto.includes('coop')) {
    return { etiqueta: 'Cooperativa', color: '#B7791F', fondo: '#FFF4D6' };
  }

  if (texto.includes('trill')) {
    return { etiqueta: 'Trilladora', color: '#7A4020', fondo: '#F6E3D6' };
  }

  return { etiqueta: 'Comprador', color: '#C8814A', fondo: '#F8E7D8' };
};

const crearIconoCafe = (tipoVisual, seleccionado = false, favorito = false) =>
  new L.DivIcon({
    className: '',
    html: `<div style="
      width:${seleccionado ? 48 : 42}px;
      height:${seleccionado ? 48 : 42}px;
      background:${favorito ? '#E67E22' : tipoVisual.color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      display:flex;
      align-items:center;
      justify-content:center;
      border:3px solid #FFF8EE;
      box-shadow:${seleccionado ? `0 10px 24px ${tipoVisual.color}66` : '0 6px 16px rgba(44,26,14,0.20)'};
      ${seleccionado ? `animation:pulse 1.2s infinite;` : ''}
    ">
      <span style="font-size:${seleccionado ? 21 : 18}px;transform:rotate(45deg);">${favorito ? '★' : '☕'}</span>
    </div>
    <style>
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(200,129,74,0.45); }
        70% { box-shadow: 0 0 0 14px rgba(200,129,74,0); }
        100% { box-shadow: 0 0 0 0 rgba(200,129,74,0); }
      }
    </style>`,
    iconSize: seleccionado ? [48, 48] : [42, 42],
    iconAnchor: seleccionado ? [24, 48] : [21, 42],
    popupAnchor: [0, -38],
  });

const iconoUsuario = new L.DivIcon({
  className: '',
  html: `<div style="
    width:40px;
    height:40px;
    background:#1a4a6b;
    border-radius:50%;
    display:flex;
    align-items:center;
    justify-content:center;
    box-shadow:0 0 0 4px rgba(26,74,107,0.3);
  ">
    <span style="font-size:18px;">📍</span>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function RestrictMapBounds() {
  const map = useMap();

  useEffect(() => {
    map.setMaxBounds(MAX_BOUNDS);
    const handleDrag = () => map.panInsideBounds(MAX_BOUNDS, { animate: false });
    map.on('drag', handleDrag);
    return () => map.off('drag', handleDrag);
  }, [map]);

  return null;
}

function VolarA({ posicion }) {
  const map = useMap();

  useEffect(() => {
    if (posicion) {
      map.flyTo(posicion, 16, { duration: 1 });
    }
  }, [map, posicion]);

  return null;
}

function SincronizarTamanoMapa({ trigger }) {
  const map = useMap();

  useEffect(() => {
    const refrescar = () => map.invalidateSize({ animate: false });
    refrescar();
    const timer = setTimeout(refrescar, 180);
    return () => clearTimeout(timer);
  }, [map, trigger]);

  return null;
}

function AjustarRuta({ ruta }) {
  const map = useMap();

  useEffect(() => {
    if (ruta?.length > 1) {
      map.fitBounds(ruta, { padding: [70, 70] });
    }
  }, [map, ruta]);

  return null;
}

function PanelDetalles({
  comprador,
  miUbicacion,
  onClose,
  onVerPerfil,
  onComoLlegar,
  onToggleFavorito,
  esFavorito,
  cargandoRuta,
  errorRuta,
  rutaActiva,
}) {
  if (!comprador) return null;

  const tipoVisual =
    comprador.tipoVisual || obtenerTipoVisual(comprador.tipoempresa || comprador.tipo, comprador.nombreempresa);
  const distancia = miUbicacion
    ? calcularDistancia(miUbicacion[0], miUbicacion[1], comprador.latitud, comprador.longitud).toFixed(1)
    : null;

  return (
    <div className="absolute inset-x-3 bottom-3 top-3 z-450 flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:inset-x-auto md:right-4 md:w-[22rem] md:max-w-[calc(100%-2rem)]">
      <div className="bg-linear-to-r from-[#3B1F0A] to-[#6B3A1F] p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div
              className="mb-2 inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold"
              style={{ backgroundColor: 'rgba(255,248,238,0.18)', color: '#FFF8EE' }}
            >
              {tipoVisual.etiqueta}
            </div>
            <h3 className="text-[1.05rem] leading-tight font-bold">{comprador.nombreempresa}</h3>
            {comprador.tipoempresa && <p className="mt-1 text-[11px] font-semibold text-[#F6D7B8]">{comprador.tipoempresa}</p>}
            <p className="mt-1 text-xs text-[#F1C38D]">
              {comprador.calificacion || '4.8'} · {comprador.tipoempresa || comprador.tipo || 'Comprador verificado'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onToggleFavorito(comprador._id)} className="text-2xl transition-transform hover:scale-110">
              {esFavorito ? '★' : '☆'}
            </button>
            <button onClick={onClose} className="text-xl text-white/70 transition-colors hover:text-white">
              ✕
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto p-4">
        <div className="flex items-start gap-3 text-sm">
          <span className="text-xl">📍</span>
          <div>
            <span className="text-gray-700">{comprador.direccion}</span>
            {comprador.municipio && <p className="mt-1 text-xs font-semibold text-[#8B7355]">{comprador.municipio}</p>}
            {comprador.coordenadasEstimadas && (
              <p className="mt-1 text-[11px] text-amber-600">Ubicacion aproximada segun direccion y municipio</p>
            )}
          </div>
        </div>

        {comprador.telefono && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-xl">📞</span>
            <a href={`tel:${comprador.telefono}`} className="font-medium text-[#C8814A] hover:underline">
              {comprador.telefono}
            </a>
          </div>
        )}

        {comprador.horarioApertura && comprador.horarioCierre && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-xl">🕐</span>
            <span className="text-gray-700">
              {comprador.horarioApertura} - {comprador.horarioCierre}
            </span>
          </div>
        )}

        {comprador.descripcion && (
          <div className="rounded-xl bg-[#FCF8F1] px-3 py-3 text-sm text-gray-700">{comprador.descripcion}</div>
        )}

        {comprador.servicios?.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8B7355]">Compra y servicios</p>
            <div className="flex flex-wrap gap-2">
              {comprador.servicios.slice(0, 4).map((servicio, index) => (
                <span
                  key={`${servicio}-${index}`}
                  className="rounded-full border border-[#E7D9BF] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#7A4020]"
                >
                  {servicio}
                </span>
              ))}
            </div>
          </div>
        )}

        {distancia && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-xl">📏</span>
            <span className="text-gray-700">{distancia} km de distancia</span>
            {Number(distancia) < 5 && (
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">Muy cerca</span>
            )}
          </div>
        )}

        <div className="mt-1 border-t pt-4">
          <p className="mb-1 font-bold text-[#3B1F0A]">Precio de referencia</p>
          <p className="text-[1.85rem] font-bold leading-none" style={{ color: tipoVisual.color }}>
            {Number.isFinite(comprador.precioReferencia) ? `$${comprador.precioReferencia.toLocaleString()}` : 'Sin precio'}
          </p>
          <p className="text-xs text-gray-500">
            {comprador.tipocafe
              ? `${comprador.tipocafe.replaceAll('_', ' ')} · ${comprador.unidadPrecio || 'carga'}`
              : 'Precio pendiente de publicacion'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onVerPerfil}
            className="rounded-xl border border-[#E7D9BF] bg-[#FCF8F1] px-4 py-2.5 text-sm font-semibold text-[#7A4020] transition-colors hover:bg-[#FFF3DE]"
          >
            Ver perfil
          </button>
          <button
            onClick={() => onComoLlegar(comprador)}
            className="flex-1 rounded-xl bg-[#C8814A] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B0703A]"
          >
            {cargandoRuta ? 'Trazando ruta...' : rutaActiva ? 'Actualizar ruta' : 'Como llegar'}
          </button>
        </div>

        {!miUbicacion && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            Activa tu ubicacion para ver el camino dentro del mapa.
          </p>
        )}

        {errorRuta && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {errorRuta}
          </p>
        )}
      </div>
    </div>
  );
}

export default function MapaCompradores() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [compradores, setCompradores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [volarA, setVolarA] = useState(null);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [radioKm, setRadioKm] = useState(10);
  const [filtrarPorDistancia, setFiltrarPorDistancia] = useState(false);
  const [vista, setVista] = useState('mapa');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [favoritos, setFavoritos] = useState(() => {
    const saved = localStorage.getItem('compradoresFavoritos');
    return saved ? JSON.parse(saved) : [];
  });
  const [rutaActiva, setRutaActiva] = useState(null);
  const [resumenRuta, setResumenRuta] = useState(null);
  const [cargandoRuta, setCargandoRuta] = useState(false);
  const [errorRuta, setErrorRuta] = useState('');

  useEffect(() => {
    axios
      .get(`${API_URL}/api/comprador/mapa`, { withCredentials: true })
      .then(({ data }) => {
        const normalizados = (data || []).filter(
          (comprador) => Number.isFinite(comprador.latitud) && Number.isFinite(comprador.longitud)
        );
        setCompradores(normalizados);
      })
      .catch(() => console.error('Error cargando compradores'))
      .finally(() => setCargando(false));
  }, [API_URL]);

  const obtenerMiUbicacion = () => {
    if (!navigator.geolocation) return;
    setBuscandoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const coords = [posicion.coords.latitude, posicion.coords.longitude];
        setMiUbicacion(coords);
        setVolarA(coords);
        setBuscandoUbicacion(false);
        setErrorRuta('');
      },
      () => {
        setBuscandoUbicacion(false);
        setErrorRuta('No fue posible obtener tu ubicacion actual.');
      }
    );
  };

  const toggleFavorito = (compradorId) => {
    const nuevos = favoritos.includes(compradorId)
      ? favoritos.filter((id) => id !== compradorId)
      : [...favoritos, compradorId];
    setFavoritos(nuevos);
    localStorage.setItem('compradoresFavoritos', JSON.stringify(nuevos));
  };

  const limpiarRuta = () => {
    setRutaActiva(null);
    setResumenRuta(null);
    setErrorRuta('');
  };

  const trazarRuta = async (comprador) => {
    if (!miUbicacion) {
      setErrorRuta('Activa primero tu ubicacion para calcular el camino.');
      return;
    }

    setCargandoRuta(true);
    setErrorRuta('');

    try {
      const origen = `${miUbicacion[1]},${miUbicacion[0]}`;
      const destino = `${comprador.longitud},${comprador.latitud}`;
      const respuesta = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origen};${destino}?overview=full&geometries=geojson`
      );
      const data = await respuesta.json();
      const ruta = data?.routes?.[0];

      if (!respuesta.ok || !ruta?.geometry?.coordinates?.length) {
        throw new Error('Ruta no disponible');
      }

      const coordenadas = ruta.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      setRutaActiva(coordenadas);
      setResumenRuta({
        destino: comprador.nombreempresa,
        distanciaKm: ruta.distance / 1000,
        duracionMin: ruta.duration / 60,
      });
      setSeleccionado(comprador);
      setVolarA([comprador.latitud, comprador.longitud]);
    } catch {
      setRutaActiva(null);
      setResumenRuta(null);
      setErrorRuta('No pudimos calcular la ruta en este momento. Intenta de nuevo.');
    } finally {
      setCargandoRuta(false);
    }
  };

  const compradoresFiltrados = compradores.filter((comprador) => {
    const matchBusqueda =
      comprador.nombreempresa?.toLowerCase().includes(busqueda.toLowerCase()) ||
      comprador.direccion?.toLowerCase().includes(busqueda.toLowerCase());

    if (!matchBusqueda) return false;

    if (tipoFiltro === 'Favoritos' && !favoritos.includes(comprador._id)) return false;
    if (
      tipoFiltro === 'Cooperativas' &&
      !comprador.nombreempresa?.toLowerCase().includes('coop') &&
      !(comprador.tipoempresa || comprador.tipo || '').toLowerCase().includes('coop')
    ) {
      return false;
    }
    if (
      tipoFiltro === 'Trilladoras' &&
      !comprador.nombreempresa?.toLowerCase().includes('trill') &&
      !(comprador.tipoempresa || comprador.tipo || '').toLowerCase().includes('trill')
    ) {
      return false;
    }

    if (filtrarPorDistancia && miUbicacion) {
      const distancia = calcularDistancia(miUbicacion[0], miUbicacion[1], comprador.latitud, comprador.longitud);
      if (distancia > radioKm) return false;
    }

    return true;
  });

  const compradoresMostrados = compradoresFiltrados.map((comprador) => ({
    ...comprador,
    esFavorito: favoritos.includes(comprador._id),
    tipoVisual: obtenerTipoVisual(comprador.tipoempresa || comprador.tipo, comprador.nombreempresa),
  }));

  if (cargando) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl bg-[#F5EDDC]">
        <div className="text-center">
          <div className="mb-4 animate-bounce text-6xl">☕</div>
          <p className="font-semibold text-[#6B3A1F]">Cargando mapa de compradores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-0 overflow-hidden rounded-2xl border border-[#E8D8BF] bg-white shadow-sm">
      <div className="border-b border-[#EFE3D0] bg-[#FCF8F1] px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#2C1A0E]">Mapa de Compradores</h2>
            <p className="mt-1 flex items-center gap-1 text-xs text-[#7A4020]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400"></span>
              Precios actualizados · El Pital, Huila
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {compradoresFiltrados.length} compradores activos
              {favoritos.length > 0 && ` · ${favoritos.length} favoritos`}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setVista(vista === 'mapa' ? 'lista' : 'mapa')}
              className="flex items-center gap-2 rounded-xl border border-[#C8A96E]/40 px-4 py-2 text-sm font-semibold text-[#7A4020] transition-all hover:bg-[#F5ECD7]"
            >
              {vista === 'mapa' ? 'Ver listado' : 'Ver mapa'}
            </button>
            <button
              onClick={obtenerMiUbicacion}
              disabled={buscandoUbicacion}
              className="flex items-center gap-2 rounded-xl bg-[#2C1A0E] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#3D1F0F] disabled:opacity-50"
            >
              {buscandoUbicacion ? 'Buscando...' : 'Mi ubicacion'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[#E8D8BF] bg-white p-3">
            <div className="mb-2 flex justify-between text-xs text-gray-500">
              <span>Radio de busqueda</span>
              <span className="font-bold text-[#C8814A]">{radioKm} km</span>
            </div>
            <input
              type="range"
              min="2"
              max="30"
              value={radioKm}
              onChange={(event) => setRadioKm(parseInt(event.target.value, 10))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#F2E6D3] accent-[#C8814A]"
            />
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={filtrarPorDistancia}
                onChange={(event) => setFiltrarPorDistancia(event.target.checked)}
                className="rounded"
              />
              Filtrar por distancia
            </label>
          </div>

          <div className="rounded-xl border border-[#E8D8BF] bg-white p-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar comprador..."
                className="w-full rounded-lg bg-[#FCF8F1] py-2 pl-9 pr-3 text-sm text-[#3B1F0A] outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-[#C8A96E]/35"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-[#F5EDDC] bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {['Todos', 'Cooperativas', 'Trilladoras', 'Favoritos'].map((tipo) => (
            <button
              key={tipo}
              onClick={() => setTipoFiltro(tipo)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                tipoFiltro === tipo
                  ? 'bg-[#C8814A] text-white shadow-md'
                  : 'border border-[#C8814A]/30 text-[#6B3A1F] hover:border-[#C8814A] hover:bg-[#C8814A]/5'
              }`}
            >
              {tipo === 'Favoritos'
                ? '★ Favoritos'
                : tipo === 'Todos'
                  ? '☕ Todos'
                  : tipo === 'Cooperativas'
                    ? 'Cooperativas'
                    : 'Trilladoras'}
            </button>
          ))}
        </div>
        {filtrarPorDistancia && miUbicacion && (
          <p className="mt-2 text-xs text-green-600">Mostrando compradores en un radio de {radioKm} km</p>
        )}
      </div>

      <div className="p-4">
        {vista === 'mapa' ? (
          <div className="relative z-0 overflow-hidden rounded-xl border border-[#E8D8BF] bg-[#FCF8F1]" style={{ height: '500px' }}>
            <MapContainer
              key={`mapa-${vista}`}
              center={CENTRO_PITAL}
              zoom={ZOOM_INICIAL}
              minZoom={13}
              maxZoom={18}
              zoomControl
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <SincronizarTamanoMapa trigger={`${vista}-${compradoresMostrados.length}-${radioKm}`} />
              <RestrictMapBounds />
              {volarA && <VolarA posicion={volarA} />}
              {rutaActiva && <AjustarRuta ruta={rutaActiva} />}

              {miUbicacion && (
                <Circle
                  center={miUbicacion}
                  radius={radioKm * 1000}
                  pathOptions={{ color: '#C8814A', fillColor: '#C8814A', fillOpacity: 0.08, weight: 2, dashArray: '5, 5' }}
                />
              )}

              {miUbicacion && (
                <Marker position={miUbicacion} icon={iconoUsuario}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold text-[#3B1F0A]">Tu ubicacion</p>
                      <p className="text-xs text-gray-500">Buscando compradores en {radioKm} km</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {rutaActiva && (
                <Polyline
                  positions={rutaActiva}
                  pathOptions={{ color: '#C8814A', weight: 5, opacity: 0.92, lineCap: 'round', lineJoin: 'round' }}
                />
              )}

              {compradoresMostrados.map((comprador) => (
                <Marker
                  key={comprador._id}
                  position={[comprador.latitud, comprador.longitud]}
                  icon={crearIconoCafe(comprador.tipoVisual, seleccionado?._id === comprador._id, comprador.esFavorito)}
                  eventHandlers={{
                    click: () => {
                      setSeleccionado(comprador);
                      setVolarA([comprador.latitud, comprador.longitud]);
                      setErrorRuta('');
                    },
                  }}
                />
              ))}
            </MapContainer>

            <div className="pointer-events-none absolute bottom-3 left-3 z-450 rounded-xl border border-[#E8D8BF] bg-white/88 p-2 shadow-sm backdrop-blur-sm">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#6B4B2C]">Referencias</p>
              <div className="flex flex-col gap-1 text-[11px] text-[#4A3423]">
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#C8814A]"></span><span>Comprador</span></div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#B7791F]"></span><span>Cooperativa</span></div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#7A4020]"></span><span>Trilladora</span></div>
                <div className="flex items-center gap-2"><span className="text-[#E67E22]">★</span><span>Favorito</span></div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#1a4a6b]"></span><span>Tu ubicacion</span></div>
                {rutaActiva && <div className="flex items-center gap-2"><span className="h-1.5 w-5 rounded-full bg-[#C8814A]"></span><span>Ruta activa</span></div>}
              </div>
            </div>

            {resumenRuta && (
              <div className="absolute left-3 top-3 z-450 w-[min(19rem,calc(100%-1.5rem))] rounded-2xl border border-[#E8D8BF] bg-white/93 p-3 shadow-lg backdrop-blur-sm md:left-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8B7355]">Ruta activa</p>
                    <p className="mt-1 text-sm font-semibold leading-tight text-[#2C1A0E]">{resumenRuta.destino}</p>
                    <p className="mt-1 text-[11px] text-[#7A4020]">
                      {resumenRuta.distanciaKm.toFixed(1)} km aprox. · {Math.max(1, Math.round(resumenRuta.duracionMin))} min en carro
                    </p>
                  </div>
                  <button
                    onClick={limpiarRuta}
                    className="rounded-full bg-[#FCF8F1] px-2.5 py-1 text-[11px] font-semibold text-[#7A4020] transition-colors hover:bg-[#F5ECD7]"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            )}

            {seleccionado && (
              <PanelDetalles
                comprador={seleccionado}
                miUbicacion={miUbicacion}
                onClose={() => {
                  setSeleccionado(null);
                  setErrorRuta('');
                }}
                onVerPerfil={() => navigate(`/comprador/${seleccionado._id}`)}
                onComoLlegar={trazarRuta}
                onToggleFavorito={toggleFavorito}
                esFavorito={favoritos.includes(seleccionado._id)}
                cargandoRuta={cargandoRuta}
                errorRuta={errorRuta}
                rutaActiva={rutaActiva}
              />
            )}
          </div>
        ) : (
          <div className="max-h-125 overflow-y-auto">
            {compradoresMostrados.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-400">No se encontraron compradores</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {compradoresMostrados.map((comprador) => (
                  <button
                    key={comprador._id}
                    onClick={() => {
                      setSeleccionado(comprador);
                      setVista('mapa');
                      setVolarA([comprador.latitud, comprador.longitud]);
                      setErrorRuta('');
                    }}
                    className="group flex items-start gap-3 rounded-2xl border border-[#E8D8BF] bg-linear-to-br from-white to-[#FCF8F1] p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#C8814A]/50 hover:shadow-lg"
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm"
                      style={{ backgroundColor: comprador.tipoVisual.fondo, color: comprador.tipoVisual.color }}
                    >
                      ☕
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div
                            className="mb-2 inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold"
                            style={{ backgroundColor: comprador.tipoVisual.fondo, color: comprador.tipoVisual.color }}
                          >
                            {comprador.tipoVisual.etiqueta}
                          </div>
                          <p className="line-clamp-2 text-sm font-bold leading-snug text-[#3B1F0A]">{comprador.nombreempresa}</p>
                        </div>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleFavorito(comprador._id);
                          }}
                          className="mt-0.5 text-lg text-[#B98953] transition-transform hover:scale-110"
                        >
                          {comprador.esFavorito ? '★' : '☆'}
                        </button>
                      </div>
                      <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">{comprador.direccion}</p>
                      {comprador.coordenadasEstimadas && <p className="mt-1 text-[10px] font-medium text-amber-600">Ubicacion aproximada</p>}
                      <div className="mt-3 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7355]">Precio</p>
                          <p className="mt-1 text-lg font-bold leading-none" style={{ color: comprador.tipoVisual.color }}>
                            {Number.isFinite(comprador.precioReferencia) ? `$${comprador.precioReferencia.toLocaleString()}` : 'Sin precio'}
                          </p>
                        </div>
                        <div className="rounded-full border border-[#E7D9BF] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#7A4020] shadow-sm">
                          Ver en mapa
                        </div>
                      </div>
                      {miUbicacion && (
                        <p className="mt-2 text-[11px] font-medium text-gray-400">
                          A {calcularDistancia(miUbicacion[0], miUbicacion[1], comprador.latitud, comprador.longitud).toFixed(1)} km
                        </p>
                      )}
                    </div>
                    <div className="pt-1 text-xl text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-[#C8814A]">→</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
