import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const iconoCafe = new L.DivIcon({
    className: "",
    html: `<div style="width:36px;height:36px;background:#3D1F0F;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);border:3px solid #C8A96E;display:flex;
        align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);font-size:16px;line-height:30px;">☕</span></div>`,
    iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36],
});
const CENTRO = [1.855, -75.970]; //Pital

export default function MapaCompradores() {
    const API_URL = import.meta.env.VITE_API_URL;
    const [compradores, setCompradores] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        axios.get(`${API_URL}/api/comprador/mapa`)
        .then(({ data }) => setCompradores(data))
        .finally(() => setCargando(false));
    }, [API_URL]);
    if (cargando) return (
        <div className="flex items-center justify-center h-64 bg-[#F5ECD7] rounded-2xl">
            <p className="text-[#C8A96E] font-semibold">Cargando mapa...🗺️</p>
        </div>
    );
    return (
        <div className="rounded-2xl overflow-hidden shadow-md border border-[#E0D0B0]"
            style={{ height: "420px" }}>
            <MapContainer center={CENTRO} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                {compradores.map((c) => (
                    <Marker key={c._id} position={[c.latitud, c.longitud]} icon={iconoCafe}>
                        <Popup>
                            <p className="font-bold text-sm">☕{c.nombreempresa}</p>
                            <p className="text-xs">{c.direccion}</p>
                            {c.telefono && <p className="text-xs">{c.telefono}</p>}
                            <p className="text-xs">{c.horarioApertura} - {c.horarioCierre}</p>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}

