import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix íconos Leaflet en Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Función para calcular distancia entre dos puntos (Haversine)
const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const obtenerTipoVisual = (tipo = '', nombre = '') => {
  const texto = `${tipo} ${nombre}`.toLowerCase();

  if (texto.includes('coop')) {
    return { etiqueta: 'Cooperativa', color: '#B7791F', fondo: '#FFF4D6', icono: 'C' };
  }

  if (texto.includes('trill')) {
    return { etiqueta: 'Trilladora', color: '#7A4020', fondo: '#F6E3D6', icono: 'T' };
  }

  return { etiqueta: 'Comprador', color: '#C8814A', fondo: '#F8E7D8', icono: 'C' };
};

// Ícono comprador animado
const crearIconoCafe = (tipoVisual, isSelected = false, isFavorite = false) => new L.DivIcon({
  className: '',
  html: `<div style="
    width:44px;
    height:44px;
    background:${isFavorite ? '#E67E22' : tipoVisual.color};
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    display:flex;
    align-items:center;
    justify-content:center;
    border:3px solid #FFF8EE;
    box-shadow:0 6px 16px rgba(44,26,14,0.20);
    transition:all 0.3s ease;
    ${isSelected ? `animation:pulse 1s infinite; box-shadow:0 8px 18px ${tipoVisual.color}55;` : ''}
    cursor:pointer;
  ">
    <span style="font-size:20px;transform:rotate(45deg);">${isFavorite ? '⭐' : '☕'}</span>
  </div>
  <style>
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(200,129,74,0.7); }
      70% { box-shadow: 0 0 0 15px rgba(200,129,74,0); }
      100% { box-shadow: 0 0 0 0 rgba(200,129,74,0); }
    }
  </style>`,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -38],
});

// Ícono usuario con animación
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
    animation:bounce 2s infinite;
  ">
    <span style="font-size:20px;">👨‍🌾</span>
  </div>
  <style>
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
  </style>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const CENTRO_PITAL = [2.266205, -75.805401];
const ZOOM_INICIAL = 15;
const MAX_BOUNDS = L.latLngBounds([2.259, -75.812], [2.273, -75.798]);

// Componente para restringir el movimiento del mapa
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

// Componente para volar a una posición
function VolarA({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 16, { duration: 1 });
  }, [pos, map]);
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

// Panel de detalles del comprador
function PanelDetalles({ comprador, onClose, miUbicacion, onAgregarComparador, estaEnComparador, onToggleFavorito, esFavorito }) {
  if (!comprador) return null;
  const tipoVisual = comprador.tipoVisual || obtenerTipoVisual(comprador.tipo, comprador.nombreempresa);
  
  const distancia = miUbicacion ? calcularDistancia(
    miUbicacion[0], miUbicacion[1],
    comprador.latitud, comprador.longitud
  ).toFixed(1) : null;

  return (
    <div className="absolute top-4 right-4 w-96 max-w-[calc(100%-2rem)] bg-white rounded-2xl shadow-2xl z-[450] overflow-hidden transition-all duration-300 transform translate-x-0">
      <div className="bg-gradient-to-r from-[#3B1F0A] to-[#6B3A1F] p-4 text-white">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div
              className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold mb-2"
              style={{ backgroundColor: 'rgba(255,248,238,0.18)', color: '#FFF8EE' }}
            >
              {tipoVisual.etiqueta}
            </div>
            <h3 className="font-bold text-lg">{comprador.nombreempresa}</h3>
            <p className="text-xs text-[#C8814A] mt-1">
              {comprador.calificacion || '⭐ 4.8'} · {comprador.tipo || 'Comprador verificado'}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onToggleFavorito(comprador._id)}
              className="text-2xl hover:scale-110 transition-transform"
            >
              {esFavorito ? '⭐' : '☆'}
            </button>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors text-xl">✕</button>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3 text-sm">
          <span className="text-xl">📍</span>
          <div>
            <span className="text-gray-700">{comprador.direccion}</span>
            {comprador.coordenadasEstimadas && (
              <p className="text-[11px] text-amber-600 mt-1">Ubicacion aproximada segun direccion y municipio</p>
            )}
          </div>
        </div>
        {comprador.telefono && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-xl">📞</span>
            <a href={`tel:${comprador.telefono}`} className="text-[#C8814A] hover:underline font-medium">
              {comprador.telefono}
            </a>
          </div>
        )}
        {comprador.horarioApertura && comprador.horarioCierre && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-xl">🕐</span>
            <span className="text-gray-700">{comprador.horarioApertura} - {comprador.horarioCierre}</span>
          </div>
        )}
        {distancia && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-xl">📏</span>
            <span className="text-gray-700">{distancia} km de distancia</span>
            {distancia < 5 && (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                ¡Muy cerca!
              </span>
            )}
          </div>
        )}
        <div className="border-t pt-4 mt-2">
          <p className="font-bold text-[#3B1F0A] mb-1">Precio de referencia</p>
          <p className="text-3xl font-bold" style={{ color: tipoVisual.color }}>
            {Number.isFinite(comprador.precioReferencia) ? `$${comprador.precioReferencia.toLocaleString()}` : 'Sin precio'}
          </p>
          <p className="text-xs text-gray-500">
            {comprador.tipocafe ? `${comprador.tipocafe.replaceAll('_', ' ')} · ${comprador.unidadPrecio || 'carga'}` : 'Precio pendiente de publicacion'}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const destino = `${comprador.latitud},${comprador.longitud}`;
              const origen = miUbicacion ? `${miUbicacion[0]},${miUbicacion[1]}/` : '';
              window.open(`https://www.google.com/maps/dir/${origen}${destino}`, '_blank');
            }}
            className="flex-1 bg-[#C8814A] text-white py-2.5 rounded-xl hover:bg-[#B0703A] transition-colors font-semibold text-sm"
          >
            🚗 Cómo llegar
          </button>
          <button 
            onClick={() => onAgregarComparador(comprador)}
            className={`px-4 py-2.5 rounded-xl transition-all font-semibold text-sm ${
              estaEnComparador 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {estaEnComparador ? '✓ Agregado' : '📊 Comparar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Panel comparador de precios
function PanelComparador({ compradores, onEliminar, onCerrar, onVerEnMapa }) {
  if (compradores.length === 0) return null;
  
  const mejorPrecio = Math.max(...compradores.map(c => Number(c.precioReferencia) || 0));
  
  return (
    <div className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl shadow-2xl z-[450] p-4 transition-all duration-300 transform translate-y-0">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h4 className="font-bold text-[#3B1F0A] text-lg">📊 Comparador de precios</h4>
          <p className="text-xs text-gray-500">{compradores.length} comprador(es) seleccionado(s)</p>
        </div>
        <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {compradores.map(c => (
          <div 
            key={c._id} 
            className="min-w-[200px] bg-gray-50 rounded-xl p-3 border-2 relative cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onVerEnMapa(c)}
            style={{ borderColor: c.precioReferencia === mejorPrecio && compradores.length > 1 ? '#10B981' : '#E5E7EB' }}
          >
            {Number(c.precioReferencia) === mejorPrecio && compradores.length > 1 && mejorPrecio > 0 && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                Mejor precio
              </div>
            )}
            <p className="font-bold text-sm text-[#3B1F0A] mb-1 truncate">{c.nombreempresa}</p>
            <p className="text-2xl font-bold text-[#C8814A]">
              {Number.isFinite(c.precioReferencia) ? `$${c.precioReferencia.toLocaleString()}` : 'Sin precio'}
            </p>
            <p className="text-xs text-gray-500 mb-2">/{c.unidadPrecio || 'carga'}</p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEliminar(c._id);
              }}
              className="w-full text-xs text-red-500 hover:text-red-700 font-semibold"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente principal
export default function MapaCompradores() {
  const API_URL = import.meta.env.VITE_API_URL;
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
  const [favoritos, setFavoritos] = useState(() => {
    const saved = localStorage.getItem('compradoresFavoritos');
    return saved ? JSON.parse(saved) : [];
  });
  const [compradoresComparados, setCompradoresComparados] = useState([]);
  const [mostrarComparador, setMostrarComparador] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState('Todos');

  useEffect(() => {
    axios.get(`${API_URL}/api/comprador/mapa`, { withCredentials: true })
      .then(({ data }) => {
        const normalizados = (data || []).filter((comprador) =>
          Number.isFinite(comprador.latitud) && Number.isFinite(comprador.longitud)
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
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setMiUbicacion(coords);
        setVolarA(coords);
        setBuscandoUbicacion(false);
      },
      () => setBuscandoUbicacion(false)
    );
  };

  const toggleFavorito = (compradorId) => {
    const nuevos = favoritos.includes(compradorId) 
      ? favoritos.filter(id => id !== compradorId)
      : [...favoritos, compradorId];
    setFavoritos(nuevos);
    localStorage.setItem('compradoresFavoritos', JSON.stringify(nuevos));
  };

  const agregarComparador = (comprador) => {
    if (!compradoresComparados.find(c => c._id === comprador._id)) {
      setCompradoresComparados([...compradoresComparados, comprador]);
      setMostrarComparador(true);
    }
  };

  const eliminarComparador = (id) => {
    const nuevos = compradoresComparados.filter(c => c._id !== id);
    setCompradoresComparados(nuevos);
    if (nuevos.length === 0) setMostrarComparador(false);
  };

  const verEnMapa = (comprador) => {
    setSeleccionado(comprador);
    setVolarA([comprador.latitud, comprador.longitud]);
    setVista('mapa');
  };

  const compradoresFiltrados = compradores.filter(c => {
    // Filtro por búsqueda
    const matchBusqueda = 
      c.nombreempresa?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.direccion?.toLowerCase().includes(busqueda.toLowerCase());
    if (!matchBusqueda) return false;
    
    // Filtro por tipo
    if (tipoFiltro === 'Favoritos') {
      if (!favoritos.includes(c._id)) return false;
    } else if (tipoFiltro === 'Cooperativas') {
      if (!c.nombreempresa?.toLowerCase().includes('coop') && !c.tipo?.toLowerCase().includes('coop')) return false;
    } else if (tipoFiltro === 'Trilladoras') {
      if (!c.nombreempresa?.toLowerCase().includes('trill') && !c.tipo?.toLowerCase().includes('trill')) return false;
    }
    
    // Filtro por distancia
    if (filtrarPorDistancia && miUbicacion) {
      const distancia = calcularDistancia(
        miUbicacion[0], miUbicacion[1],
        c.latitud, c.longitud
      );
      if (distancia > radioKm) return false;
    }
    
    return true;
  });

  const compradoresMostrados = compradoresFiltrados.map(c => ({
    ...c,
    esFavorito: favoritos.includes(c._id),
    tipoVisual: obtenerTipoVisual(c.tipo, c.nombreempresa),
  }));

  if (cargando) return (
    <div className="flex items-center justify-center h-96 bg-[#F5EDDC] rounded-2xl">
      <div className="text-center">
        <div className="text-6xl animate-bounce mb-4">☕</div>
        <p className="text-[#6B3A1F] font-semibold">Cargando mapa de compradores...</p>
      </div>
    </div>
  );

  return (
    <div className="relative z-0 bg-white rounded-2xl shadow-sm overflow-hidden border border-[#E8D8BF]">
      {/* Encabezado */}
      <div className="px-5 py-5 border-b border-[#EFE3D0] bg-[#FCF8F1]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-[#2C1A0E] text-xl font-bold">Mapa de Compradores</h2>
            <p className="text-[#7A4020] text-xs flex items-center gap-1 mt-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Precios actualizados · El Pital, Huila
            </p>
            <p className="text-gray-500 text-xs mt-1">
              📍 {compradoresFiltrados.length} compradores activos
              {favoritos.length > 0 && ` · ⭐ ${favoritos.length} favoritos`}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setVista(vista === 'mapa' ? 'lista' : 'mapa')}
              className="flex items-center gap-2 border border-[#C8A96E]/40 text-[#7A4020] px-4 py-2 rounded-xl transition-all text-sm font-semibold hover:bg-[#F5ECD7]"
            >
              {vista === 'mapa' ? '📋 Ver listado' : '🗺️ Ver mapa'}
            </button>
            <button 
              onClick={obtenerMiUbicacion} 
              disabled={buscandoUbicacion}
              className="flex items-center gap-2 bg-[#2C1A0E] hover:bg-[#3D1F0F] text-white px-4 py-2 rounded-xl transition-all disabled:opacity-50 text-sm font-semibold"
            >
              🎯 {buscandoUbicacion ? 'Buscando...' : 'Mi ubicación'}
            </button>
          </div>
        </div>

        {/* Controles de filtro */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 border border-[#E8D8BF]">
            <div className="flex justify-between text-gray-500 text-xs mb-2">
              <span>Radio de búsqueda</span>
              <span className="text-[#C8814A] font-bold">{radioKm} km</span>
            </div>
            <input 
              type="range" 
              min="2" 
              max="30" 
              value={radioKm} 
              onChange={(e) => setRadioKm(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#F2E6D3] rounded-lg appearance-none cursor-pointer accent-[#C8814A]"
            />
            <label className="flex items-center gap-2 mt-2 text-gray-500 text-xs cursor-pointer">
              <input 
                type="checkbox" 
                checked={filtrarPorDistancia} 
                onChange={(e) => setFiltrarPorDistancia(e.target.checked)}
                className="rounded cursor-pointer"
              />
              Filtrar por distancia
            </label>
          </div>
          
          <div className="bg-white rounded-xl p-3 border border-[#E8D8BF]">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">🔍</span>
              <input 
                type="text" 
                value={busqueda} 
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar comprador..."
                className="w-full bg-[#FCF8F1] rounded-lg pl-9 pr-3 py-2 text-[#3B1F0A] text-sm placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#C8A96E]/35 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros rápidos */}
      <div className="p-4 bg-white border-b border-[#F5EDDC]">
        <div className="flex gap-2 flex-wrap">
          {['Todos', 'Cooperativas', 'Trilladoras', 'Favoritos'].map((tipo) => (
            <button 
              key={tipo} 
              onClick={() => setTipoFiltro(tipo)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                tipoFiltro === tipo 
                  ? 'bg-[#C8814A] text-white shadow-md' 
                  : 'border border-[#C8814A]/30 text-[#6B3A1F] hover:border-[#C8814A] hover:bg-[#C8814A]/5'
              }`}
            >
              {tipo === 'Favoritos' ? '⭐ Favoritos' : tipo === 'Todos' ? '☕ Todos' : tipo === 'Cooperativas' ? '🤝 Cooperativas' : '🏭 Trilladoras'}
            </button>
          ))}
        </div>
        {filtrarPorDistancia && miUbicacion && (
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <span>✅</span> Mostrando compradores en un radio de {radioKm} km
          </p>
        )}
      </div>

      {/* Contenido principal */}
      <div className="p-4">
        {vista === 'mapa' ? (
          <div className="relative z-0 rounded-xl overflow-hidden border border-[#E8D8BF] bg-[#FCF8F1]" style={{ height: '500px' }}>
            <MapContainer 
              key={`mapa-${vista}`}
              className="z-0"
              center={CENTRO_PITAL} 
              zoom={ZOOM_INICIAL}
              minZoom={13}
              maxZoom={18}
              zoomControl={true}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <SincronizarTamanoMapa trigger={`${vista}-${compradoresMostrados.length}-${radioKm}`} />
              <RestrictMapBounds />
              {volarA && <VolarA pos={volarA} />}

              {/* Círculo de radio */}
              {miUbicacion && (
                <Circle 
                  center={miUbicacion} 
                  radius={radioKm * 1000} 
                  pathOptions={{ color: '#C8814A', fillColor: '#C8814A', fillOpacity: 0.08, weight: 2, dashArray: '5, 5' }} 
                />
              )}

              {/* Marcador de ubicación */}
              {miUbicacion && (
                <Marker position={miUbicacion} icon={iconoUsuario}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold text-[#3B1F0A]">📍 Tú estás aquí</p>
                      <p className="text-xs text-gray-500">Buscando compradores en {radioKm} km</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Marcadores de compradores */}
              {compradoresMostrados.map((c) => (
                <Marker 
                  key={c._id} 
                  position={[c.latitud, c.longitud]} 
                  icon={crearIconoCafe(c.tipoVisual, seleccionado?._id === c._id, c.esFavorito)}
                  eventHandlers={{
                    click: () => {
                      setSeleccionado(c);
                      setVolarA([c.latitud, c.longitud]);
                    }
                  }}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <div
                        className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold mb-2"
                        style={{ backgroundColor: c.tipoVisual.fondo, color: c.tipoVisual.color }}
                      >
                        {c.tipoVisual.etiqueta}
                      </div>
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-[#3B1F0A]">☕ {c.nombreempresa}</p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorito(c._id);
                          }}
                          className="text-lg hover:scale-110 transition-transform"
                        >
                          {c.esFavorito ? '⭐' : '☆'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{c.direccion}</p>
                      {c.coordenadasEstimadas && (
                        <p className="text-[10px] text-amber-600 mt-1">Ubicacion aproximada</p>
                      )}
                      <p className="text-sm font-bold mt-1" style={{ color: c.tipoVisual.color }}>
                        {Number.isFinite(c.precioReferencia) ? `$${c.precioReferencia.toLocaleString()}` : 'Sin precio'}
                      </p>
                      {miUbicacion && (
                        <p className="text-xs text-gray-500 mt-1">
                          📏 a {calcularDistancia(miUbicacion[0], miUbicacion[1], c.latitud, c.longitud).toFixed(1)} km
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Leyenda */}
            <div className="pointer-events-none absolute bottom-3 left-3 bg-white/92 backdrop-blur-sm rounded-xl p-2.5 shadow-sm border border-[#E8D8BF] z-[450]">
              <p className="font-bold text-[#3B1F0A] text-[10px] uppercase tracking-wide mb-1">Referencias</p>
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#C8814A]"></span><span>Comprador</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#B7791F]"></span><span>Cooperativa</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#7A4020]"></span><span>Trilladora</span></div>
                <div className="flex items-center gap-2"><span className="text-[#E67E22]">⭐</span><span>Favorito</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#1a4a6b]"></span><span>Tu ubicación</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#C8814A] opacity-30 border border-[#C8814A]"></span><span>Radio {radioKm} km</span></div>
              </div>
            </div>

            {/* Panel de detalles */}
            {seleccionado && (
              <PanelDetalles 
                comprador={seleccionado}
                onClose={() => setSeleccionado(null)}
                miUbicacion={miUbicacion}
                onAgregarComparador={agregarComparador}
                estaEnComparador={compradoresComparados.some(c => c._id === seleccionado._id)}
                onToggleFavorito={toggleFavorito}
                esFavorito={favoritos.includes(seleccionado._id)}
              />
            )}
          </div>
        ) : (
          /* Vista de lista */
          <div className="max-h-[500px] overflow-y-auto">
            {compradoresMostrados.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No se encontraron compradores</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {compradoresMostrados.map((c) => (
                  <button 
                    key={c._id} 
                    onClick={() => {
                      setSeleccionado(c);
                      setVista('mapa');
                      setVolarA([c.latitud, c.longitud]);
                    }}
                    className="flex items-center gap-3 p-4 rounded-xl text-left transition-all border-2 bg-white hover:shadow-lg hover:border-[#C8814A]/50 group"
                  >
                    <div className="text-3xl">☕</div>
                    <div className="flex-1">
                      <div
                        className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold mb-2"
                        style={{ backgroundColor: c.tipoVisual.fondo, color: c.tipoVisual.color }}
                      >
                        {c.tipoVisual.etiqueta}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#3B1F0A]">{c.nombreempresa}</p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorito(c._id);
                          }}
                          className="text-lg hover:scale-110 transition-transform"
                        >
                          {c.esFavorito ? '⭐' : '☆'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{c.direccion}</p>
                      {c.coordenadasEstimadas && (
                        <p className="text-[10px] text-amber-600 mt-1">Ubicacion aproximada</p>
                      )}
                      <p className="text-sm font-bold mt-1" style={{ color: c.tipoVisual.color }}>
                        {Number.isFinite(c.precioReferencia) ? `$${c.precioReferencia.toLocaleString()}` : 'Sin precio'}
                      </p>
                      {miUbicacion && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          📏 a {calcularDistancia(miUbicacion[0], miUbicacion[1], c.latitud, c.longitud).toFixed(1)} km
                        </p>
                      )}
                    </div>
                    <div className="text-2xl text-gray-300 group-hover:text-[#C8814A] group-hover:translate-x-1 transition-all">→</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panel comparador */}
      {mostrarComparador && compradoresComparados.length > 0 && (
        <PanelComparador 
          compradores={compradoresComparados}
          onEliminar={eliminarComparador}
          onCerrar={() => setMostrarComparador(false)}
          onVerEnMapa={verEnMapa}
        />
      )}
    </div>
  );
}
