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

// Ícono comprador (☕ café) con estilo similar al HTML
const iconoCafe = new L.DivIcon({
  className: '',
  html: `<div style="width:40px;height:40px;background:#C8814A;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.25);"><span style="font-size:18px;transform:rotate(45deg);">☕</span></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -36],
});

// Ícono usuario (tu ubicación) – estilo "tú estás aquí"
const iconoUsuario = new L.DivIcon({
  className: '',
  html: `<div style="width:36px;height:36px;background:#1a4a6b;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(26,74,107,0.3);"><span style="font-size:16px;">👨‍🌾</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Centro exacto de la plaza/iglesia de El Pital, Huila
const CENTRO_PITAL = [2.266205, -75.805401];
const ZOOM_INICIAL = 15; // Un zoom medio que abarca bien el pueblo sin alejarse

// Límites ajustados para que el usuario no se salga del área urbana
const MAX_BOUNDS = L.latLngBounds(
  [2.259, -75.812], // Suroeste (abarca desde el sur y oeste del pueblo)
  [2.273, -75.798]  // Noreste (abarca hasta el norte y este)
);

// Componente para restringir el movimiento del mapa
function RestrictMapBounds() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(MAX_BOUNDS);
    const handleDrag = () => {
      map.panInsideBounds(MAX_BOUNDS, { animate: false });
    };
    map.on('drag', handleDrag);
    return () => {
      map.off('drag', handleDrag);
    };
  }, [map]);
  return null;
}

// Componente para volar a una posición
function VolarA({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 15, { duration: 1 });
  }, [pos, map]);
  return null;
}

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

  useEffect(() => {
    axios.get(`${API_URL}/api/comprador/mapa`)
      .then(({ data }) => setCompradores(data))
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

  const compradoresFiltrados = compradores.filter(c =>
    c.nombreempresa?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.direccion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) return (
    <div className="flex items-center justify-center h-64 bg-[#F5EDDC] rounded-2xl">
      <p className="text-[#6B3A1F] font-semibold animate-pulse">☕ Cargando mapa de compradores...</p>
    </div>
  );

  return (
    <div className="bg-[#FBF7F0] rounded-2xl shadow-lg overflow-hidden border border-[#C8814A]/20" style={{ maxWidth: '100%' }}>
      {/* Encabezado interno estilo panel */}
      <div className="bg-linear-to-r from-[#3B1F0A] to-[#6B3A1F] px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-white text-xl font-bold font-['Playfair_Display']">Mapa de Compradores</h2>
            <p className="text-[#C8814A] text-xs flex items-center gap-1 mt-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"></span>
              Precios en tiempo real · El Pital, Huila
            </p>
            <p className="text-white/60 text-xs mt-1">
              📍 {compradoresFiltrados.length} compradores activos cerca
            </p>
          </div>
          <button 
            onClick={obtenerMiUbicacion} 
            disabled={buscandoUbicacion}
            className="flex items-center gap-2 bg-[#C8814A]/20 hover:bg-[#C8814A]/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            🎯 {buscandoUbicacion ? 'Buscando...' : 'Mi ubicación'}
          </button>
        </div>

        {/* Control de radio (estilo similar al HTML) */}
        <div className="mt-4 bg-white/10 rounded-lg p-3">
          <div className="flex justify-between text-white/70 text-xs mb-2">
            <span>Radio de búsqueda</span>
            <span className="text-[#C8814A] font-bold">{radioKm} km</span>
          </div>
          <input 
            type="range" 
            min="2" 
            max="30" 
            value={radioKm} 
            onChange={(e) => setRadioKm(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#C8814A]"
          />
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div className="p-4 bg-white border-b border-[#F5EDDC]">
        <div className="flex gap-2 items-center bg-[#F5EDDC] rounded-xl px-3 py-2 border border-[#C8814A]/20 focus-within:border-[#C8814A] transition-colors">
          <span className="text-[#6B3A1F]">🔍</span>
          <input 
            type="text" 
            value={busqueda} 
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar comprador..."
            className="bg-transparent outline-none text-[#3B1F0A] text-sm w-full placeholder:text-[#7B5C3E]/60"
          />
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {['Todos', 'Cooperativas', 'Trilladoras', 'Especial'].map((tipo) => (
            <button key={tipo} className="px-3 py-1.5 text-xs font-semibold rounded-full border border-[#C8814A]/30 text-[#6B3A1F] hover:border-[#C8814A] hover:text-[#C8814A] transition-all">
              {tipo === 'Todos' ? '☕ Todos' : tipo === 'Cooperativas' ? '🤝 Cooperativas' : tipo === 'Trilladoras' ? '🏭 Trilladoras' : '🌟 Especial'}
            </button>
          ))}
        </div>
      </div>

      {/* Contenedor del mapa con tamaño controlado */}
      <div className="p-4">
        <div className="rounded-xl overflow-hidden shadow-md border-2 border-[#C8814A]/30 bg-[#88b850]" style={{ height: '420px', position: 'relative' }}>
          <MapContainer 
            center={CENTRO_PITAL} 
            zoom={ZOOM_INICIAL}
            minZoom={13}
            maxZoom={17}
            zoomControl={true}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            {/* TileLayer estilo mapa base "rústico/callejero" (sin satélite) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={19}
            />
            
            <RestrictMapBounds />
            {volarA && <VolarA pos={volarA} />}

            {/* Círculo de radio alrededor de mi ubicación */}
            {miUbicacion && (
              <Circle 
                center={miUbicacion} 
                radius={radioKm * 1000} 
                pathOptions={{ color: '#C8814A', fillColor: '#C8814A', fillOpacity: 0.08, weight: 2, dashArray: '5, 5' }} 
              />
            )}

            {/* Marcador de mi ubicación */}
            {miUbicacion && (
              <Marker position={miUbicacion} icon={iconoUsuario}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-[#3B1F0A] text-sm">📍 Tú estás aquí</p>
                    <p className="text-xs text-gray-500">{radioKm} km a la redonda</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Marcadores de compradores */}
            {compradoresFiltrados.map((c) => (
              <Marker 
                key={c._id} 
                position={[c.latitud, c.longitud]} 
                icon={iconoCafe}
                eventHandlers={{
                  click: () => {
                    setSeleccionado(c);
                    setVolarA([c.latitud, c.longitud]);
                  }
                }}
              >
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <p className="font-bold text-[#3B1F0A] text-sm">☕ {c.nombreempresa}</p>
                    <p className="text-xs text-gray-500 mt-1">{c.direccion}</p>
                    {c.telefono && <p className="text-xs mt-1">📞 {c.telefono}</p>}
                    {c.horarioApertura && c.horarioCierre && (
                      <p className="text-xs mt-1">🕐 {c.horarioApertura} – {c.horarioCierre}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Leyenda del mapa (estilo HTML) */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-md border border-[#C8814A]/20 z-50 text-xs">
            <p className="font-bold text-[#3B1F0A] text-[10px] uppercase tracking-wide mb-1">Referencias</p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#C8814A]"></span><span className="text-[#6B3A1F]">Cooperativa</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#6B3A1F]"></span><span className="text-[#6B3A1F]">Trilladora</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#2D6A2D]"></span><span className="text-[#6B3A1F]">Café especial</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#1a4a6b]"></span><span className="text-[#6B3A1F]">Tu ubicación</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de compradores (estilo similar al HTML) */}
      {compradoresFiltrados.length > 0 && (
        <div className="px-4 pb-4 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {compradoresFiltrados.slice(0, 6).map((c, idx) => (
              <button 
                key={c._id} 
                onClick={() => { setSeleccionado(c); setVolarA([c.latitud, c.longitud]); }}
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${seleccionado?._id === c._id ? 'bg-[#C8814A]/10 border-[#C8814A]' : 'bg-white border-[#F5EDDC] hover:border-[#C8814A]/50'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-linear-to-br from-yellow-400 to-amber-500 text-white' : idx === 1 ? 'bg-linear-to-br from-gray-300 to-gray-400 text-white' : idx === 2 ? 'bg-linear-to-br from-amber-700 to-amber-800 text-white' : 'bg-[#F5EDDC] text-[#7B5C3E]'}`}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#3B1F0A] text-sm">{c.nombreempresa}</p>
                  <p className="text-xs text-[#7B5C3E]">📍 {c.direccion?.split(',')[0] || 'El Pital'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#3B1F0A] text-sm">${(c.precioReferencia || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-[#7B5C3E]">COP/carga</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
