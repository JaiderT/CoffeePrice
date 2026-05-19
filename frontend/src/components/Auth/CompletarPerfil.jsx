import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../../context/useAuth.js";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const CENTRO_PITAL = [2.266205, -75.805401];

const SERVICIOS_OPCIONES = [
  "Café pergamino seco",
  "Café especial",
  "Café orgánico",
  "Café verde",
  "Pasilla",
  "Cacao",
  "Maíz",
  "Fique",
  "Otros productos agrícolas",
];

const MUNICIPIOS = [
  "El Pital",
  "Pitalito",
  "Acevedo",
  "La Argentina",
  "Tarqui",
  "Suaza",
  "Palestina",
  "Elías",
  "Saladoblanco",
  "Isnos",
];

function ActualizarVistaMapa({ centro }) {
  const map = useMap();

  useEffect(() => {
    if (centro?.length === 2) {
      map.flyTo(centro, Math.max(map.getZoom(), 16), { duration: 0.8 });
    }
  }, [centro, map]);

  return null;
}

function PinUbicacion({ posicion, onChange }) {
  useMapEvents({
    click(evento) {
      onChange({
        latitud: Number(evento.latlng.lat.toFixed(6)),
        longitud: Number(evento.latlng.lng.toFixed(6)),
      });
    },
  });

  return (
    <Marker
      position={posicion}
      draggable
      eventHandlers={{
        dragend: (evento) => {
          const latLng = evento.target.getLatLng();
          onChange({
            latitud: Number(latLng.lat.toFixed(6)),
            longitud: Number(latLng.lng.toFixed(6)),
          });
        },
      }}
    />
  );
}

export default function CompletarPerfil() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { usuario, login, actualizarUsuario } = useAuth();

  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [sesionValida, setSesionValida] = useState(false);
  const [perfilExistente, setPerfilExistente] = useState(false);
  const [perfilComprador, setPerfilComprador] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ubicandoMapa, setUbicandoMapa] = useState(false);

  const [form, setForm] = useState({
    nombreempresa: "",
    tipoempresa: "independiente",
    direccion: "",
    municipio: "El Pital",
    telefono: "",
    horarioApertura: "07:00",
    horarioCierre: "17:00",
    descripcion: "",
    servicios: [],
    latitud: null,
    longitud: null,
  });

  const totalChecks = 6;
  const checksCompletados = [
    form.nombreempresa.trim(),
    form.direccion.trim(),
    form.telefono.trim(),
    form.servicios.length > 0,
    form.municipio.trim(),
    Number.isFinite(form.latitud) && Number.isFinite(form.longitud),
  ].filter(Boolean).length;
  const progresoPerfil = Math.round((checksCompletados / totalChecks) * 100);

  useEffect(() => {
    let activo = true;

    async function validarSesion() {
      try {
        let sessionUser = usuario;

        if (usuario?.rol === "comprador") {
          setSesionValida(true);
          if (usuario.estado === "activo") {
            navigate("/comprador/dashboard", { replace: true });
            return;
          }
        } else {
          const response = await fetch(`${API_URL}/api/auth/me`, {
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error("No hay sesión válida");
          }

          const userData = await response.json();
          if (!activo) return;

          if (userData.rol !== "comprador") {
            setSesionValida(false);
            return;
          }

          login({
            id: userData._id,
            rol: userData.rol,
            nombre: userData.nombre,
            apellido: userData.apellido,
            celular: userData.celular,
            email: userData.email,
            estado: userData.estado,
          });

          sessionUser = {
            id: userData._id,
            rol: userData.rol,
            estado: userData.estado,
          };

          setSesionValida(true);

          if (userData.estado === "activo") {
            navigate("/comprador/dashboard", { replace: true });
            return;
          }
        }

        const usuarioId = sessionUser?.id;
        const rutaComprador = usuarioId ? `${API_URL}/api/comprador/usuario/${usuarioId}` : null;

        if (rutaComprador) {
          const perfilResponse = await fetch(rutaComprador, {
            credentials: "include",
          });

          if (perfilResponse.ok) {
            const perfil = await perfilResponse.json();
            if (!activo) return;

            setPerfilExistente(true);
            setPerfilComprador(perfil);

            if (perfil.estadoRevision === "aprobado") {
              actualizarUsuario({ estado: "activo" });
              navigate("/comprador/dashboard", { replace: true });
              return;
            }
          }
        }
      } catch {
        if (activo) {
          setSesionValida(false);
        }
      } finally {
        if (activo) {
          setCargandoSesion(false);
        }
      }
    }

    validarSesion();
    return () => {
      activo = false;
    };
  }, [API_URL, actualizarUsuario, login, navigate, usuario]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleServicio = (servicio) => {
    setForm((prev) => ({
      ...prev,
      servicios: prev.servicios.includes(servicio)
        ? prev.servicios.filter((s) => s !== servicio)
        : [...prev.servicios, servicio],
    }));
  };

  const validarNombreEmpresa = (nombre) => {
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.&]+$/;
    return soloLetras.test(nombre.trim());
  };

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no permite obtener la ubicación");
      return;
    }

    setUbicandoMapa(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((prev) => ({
          ...prev,
          latitud: Number(coords.latitude.toFixed(6)),
          longitud: Number(coords.longitude.toFixed(6)),
        }));
        setUbicandoMapa(false);
      },
      () => {
        setError("No pudimos obtener tu ubicación exacta");
        setUbicandoMapa(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.nombreempresa.trim()) {
      setError("El nombre de la empresa es obligatorio");
      return;
    }
    if (!validarNombreEmpresa(form.nombreempresa)) {
      setError("El nombre de la empresa solo puede contener letras, espacios, puntos y &");
      return;
    }
    if (!form.direccion.trim()) {
      setError("La dirección es obligatoria");
      return;
    }
    if (!form.telefono.trim()) {
      setError("El teléfono es obligatorio");
      return;
    }
    if (form.servicios.length === 0) {
      setError("Selecciona al menos un producto o servicio que ofreces");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/comprador`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "No se pudo enviar el perfil");
        return;
      }

      setPerfilExistente(true);
      setPerfilComprador(data.comprador || null);
      setSuccess(true);
    } catch {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const tieneUbicacionExacta = Number.isFinite(form.latitud) && Number.isFinite(form.longitud);
  const posicionMapa = tieneUbicacionExacta ? [form.latitud, form.longitud] : CENTRO_PITAL;
  const estadoRevisionActual = perfilComprador?.estadoRevision || null;
  const resumenEstadoPerfil = (() => {
    if (estadoRevisionActual === "rechazado") {
      return {
        icono: "!",
        titulo: "Solicitud rechazada",
        descripcion: "El admin revisó tu empresa y dejó observaciones antes de aprobarla.",
        detalle: "Revisa el motivo registrado y coordina la corrección con el equipo administrador.",
        color: "bg-red-100 text-red-600",
      };
    }

    if (estadoRevisionActual === "aprobado") {
      return {
        icono: "✓",
        titulo: "Perfil aprobado",
        descripcion: "Tu empresa ya fue aprobada y tu cuenta puede operar como comprador.",
        detalle: "Si sigues viendo esta pantalla, vuelve a iniciar sesión para refrescar tu acceso.",
        color: "bg-green-100 text-green-600",
      };
    }

    return {
      icono: "✓",
      titulo: "Perfil en revisión",
      descripcion: "Tu perfil empresarial ya fue enviado al administrador.",
      detalle: "Cuando se apruebe, tu cuenta pasará a activa y podrás entrar como comprador.",
      color: "bg-amber-100 text-amber-700",
    };
  })();

  if (cargandoSesion) {
    return (
      <div className="min-h-screen bg-[#3D1F0F] flex items-center justify-center">
        <p className="text-white">Cargando...</p>
      </div>
    );
  }

  if (!sesionValida) {
    return <Navigate to="/login" replace />;
  }

  if (success || perfilExistente) {
    return (
      <div className="min-h-screen bg-[#3D1F0F] flex items-center justify-center px-4">
        <div className="bg-[#FAF7F2] rounded-3xl p-8 sm:p-10 max-w-xl w-full shadow-[0_24px_60px_rgba(0,0,0,0.22)] border border-white/60">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-black text-[#3B1F0A] mb-3">Perfil en revisión</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-2">
            Tu perfil empresarial ya fue enviado al administrador.
          </p>
          <p className="text-xs text-gray-400 mb-8">
            Cuando se apruebe, tu cuenta pasará a activa y podrás entrar como comprador.
          </p>
          <div className={`rounded-2xl px-4 py-4 mb-6 flex items-start gap-3 border ${resumenEstadoPerfil.color}`}>
            <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center text-lg font-black shrink-0">
              {resumenEstadoPerfil.icono}
            </div>
            <div className="text-left">
              <p className="font-bold">{resumenEstadoPerfil.titulo}</p>
              <p className="text-sm opacity-90">{resumenEstadoPerfil.detalle}</p>
            </div>
          </div>
          {perfilComprador && (
            <div className="bg-white border border-[#E8D8BF] rounded-[24px] p-5 space-y-4 mb-6 shadow-[0_10px_28px_rgba(77,48,24,0.06)]">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs font-bold text-[#8B6B45] uppercase">Resumen enviado al admin</span>
                <span className="text-[11px] px-3 py-1 rounded-full bg-[#F5ECD7] text-[#7A4020] font-semibold">
                  {estadoRevisionActual || "enRevision"}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-sm text-left">
                <div>
                  <p className="text-gray-400 text-xs">Empresa</p>
                  <p className="text-[#2C1A0E] font-semibold">{perfilComprador.nombreempresa}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Municipio</p>
                  <p className="text-[#2C1A0E] font-semibold">{perfilComprador.municipio || "El Pital"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Teléfono</p>
                  <p className="text-[#2C1A0E] font-semibold">{perfilComprador.telefono || "No registrado"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Ubicación exacta</p>
                  <p className="text-[#2C1A0E] font-semibold">
                    {Number.isFinite(perfilComprador.latitud) && Number.isFinite(perfilComprador.longitud)
                      ? "Mapa exacto enviado"
                      : "Sin punto exacto en mapa"}
                  </p>
                </div>
              </div>
              {perfilComprador.motivoRevision && (
                <div className="rounded-2xl bg-[#FFF4F1] border border-red-100 px-4 py-3 text-left">
                  <p className="text-xs font-bold text-red-500 uppercase mb-1">Observación del admin</p>
                  <p className="text-sm text-[#6B3A2A]">{perfilComprador.motivoRevision}</p>
                </div>
              )}
              <div className="grid sm:grid-cols-3 gap-3 text-xs text-left">
                <div className="rounded-2xl bg-[#FCF8F1] px-3 py-3 border border-[#E8D8BF]">
                  <p className="font-bold text-[#7A4020] mb-1">1. Registro</p>
                  <p className="text-gray-500">Tus datos básicos ya quedaron creados y verificados.</p>
                </div>
                <div className="rounded-2xl bg-[#FCF8F1] px-3 py-3 border border-[#E8D8BF]">
                  <p className="font-bold text-[#7A4020] mb-1">2. Perfil empresa</p>
                  <p className="text-gray-500">El admin ya recibió empresa, dirección y punto de compra.</p>
                </div>
                <div className="rounded-2xl bg-[#FCF8F1] px-3 py-3 border border-[#E8D8BF]">
                  <p className="font-bold text-[#7A4020] mb-1">3. Decisión</p>
                  <p className="text-gray-500">Solo aparecerás en la plataforma cuando tu perfil quede aprobado.</p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3.5 rounded-xl text-white text-sm font-bold shadow-lg"
            style={{ background: "linear-gradient(135deg, #C8814A, #7A4020)" }}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#3D1F0F] flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 py-12 relative overflow-hidden">
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(200,129,74,0.15) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-20 left-10 w-72 h-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(200,129,74,0.08) 0%, transparent 70%)" }}
        />

        <div className="flex items-center gap-3 mb-16 relative z-10">
          <div className="w-12 h-12 bg-[#C8814A] rounded-xl flex items-center justify-center text-2xl shadow-lg">☕</div>
          <span className="text-5xl font-black text-white" style={{ fontFamily: "Georgia, serif" }}>CoffePrice</span>
        </div>

        <h1 className="text-6xl font-black text-white leading-tight mb-5 relative z-10" style={{ fontFamily: "Georgia, serif" }}>
          Casi listo <br />
          <span className="text-[#E8A870] italic text-5xl">para comprar café</span>
        </h1>

        <p className="text-white/65 text-xl leading-relaxed max-w-sm mb-10 relative z-10">
          Completa los datos de tu empresa para que el administrador pueda validarla con más confianza.
        </p>

        <div className="flex flex-col gap-3 relative z-10">
          <div className="bg-[#C8814A]/20 rounded-2xl px-5 py-4 border border-[#C8814A]/30">
            <p className="text-white/60 text-xs mb-1">Estado de tu cuenta</p>
            <p className="text-[#E8A870] font-bold text-sm">Pendiente de aprobación del admin</p>
          </div>
          <div className="bg-white/10 rounded-2xl px-5 py-4 border border-white/10">
            <p className="text-white/60 text-xs mb-1">Qué revisará el admin</p>
            <p className="text-white font-semibold text-sm">Empresa, dirección, contacto, servicios y ubicación exacta del punto de compra</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-[#FAF7F2] flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="w-10 h-10 bg-[#C8814A] rounded-xl flex items-center justify-center text-xl">☕</div>
          <span className="text-3xl font-black text-[#3B1F0A]" style={{ fontFamily: "Georgia, serif" }}>CoffePrice</span>
        </div>

        <div className="mb-6">
          <span className="text-xs font-bold text-[#C8814A] bg-[#C8814A]/10 px-3 py-1 rounded-full">Perfil de comprador</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-[#3B1F0A] mb-1.5" style={{ fontFamily: "Georgia, serif" }}>
          Datos de tu empresa
        </h2>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          Esta información se enviará al administrador para revisión. Hasta que apruebe tu cuenta, no aparecerás en el mapa, precios ni perfiles públicos.
        </p>

        <div className="mb-8 rounded-[24px] border border-[#E8D8BF] bg-white px-5 py-4 shadow-[0_10px_28px_rgba(77,48,24,0.06)]">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8B6B45]">Avance del perfil</p>
              <p className="text-sm text-[#3B1F0A] font-semibold mt-1">{checksCompletados} de {totalChecks} puntos listos</p>
            </div>
            <span className="rounded-full bg-[#FCF3E6] px-3 py-1 text-xs font-bold text-[#C8814A]">
              {progresoPerfil}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#F3E6D4] overflow-hidden mb-3">
            <div className="h-full rounded-full bg-linear-to-r from-[#C8814A] to-[#7A4020]" style={{ width: `${progresoPerfil}%` }} />
          </div>
          <div className="grid sm:grid-cols-3 gap-2 text-xs">
            <div className="rounded-2xl border border-[#E8D8BF] bg-[#FCF8F1] px-3 py-2.5 text-[#6B5A4D]">
              Empresa, municipio y dirección
            </div>
            <div className="rounded-2xl border border-[#E8D8BF] bg-[#FCF8F1] px-3 py-2.5 text-[#6B5A4D]">
              Contacto, horarios y servicios
            </div>
            <div className="rounded-2xl border border-[#E8D8BF] bg-[#FCF8F1] px-3 py-2.5 text-[#6B5A4D]">
              Punto exacto en mapa para revisión
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Nombre de la empresa *</label>
            <input
              type="text"
              required
              placeholder="Ej: Cooperativa El Pital"
              value={form.nombreempresa}
              onChange={(e) => handleChange("nombreempresa", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50"
            />
            <p className="text-xs text-gray-400 mt-1">Solo letras, espacios, puntos y &</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Tipo de empresa *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { value: "cooperativa", label: "Cooperativa" },
                { value: "trilladora", label: "Trilladora" },
                { value: "independiente", label: "Independiente" },
                { value: "exportadora", label: "Exportadora" },
                { value: "otro", label: "Otro" },
              ].map((tipo) => (
                <button
                  key={tipo.value}
                  type="button"
                  onClick={() => handleChange("tipoempresa", tipo.value)}
                  className={`py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition-all text-left ${
                    form.tipoempresa === tipo.value
                      ? "border-[#C8814A] bg-[#C8814A]/10 text-[#3B1F0A]"
                      : "border-gray-200 bg-white text-gray-500 hover:border-[#C8814A]/40"
                  }`}
                >
                  {tipo.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Municipio *</label>
            <select
              value={form.municipio}
              onChange={(e) => handleChange("municipio", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50"
            >
              {MUNICIPIOS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Dirección del punto físico *</label>
            <input
              type="text"
              required
              placeholder="Ej: Carrera 9 #10-15, El Pital, Huila"
              value={form.direccion}
              onChange={(e) => handleChange("direccion", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50"
            />
          </div>

          <div className="rounded-[24px] border border-[#C8A96E]/30 p-4 bg-[#FCF8F1] shadow-[0_10px_24px_rgba(77,48,24,0.05)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-[#3B1F0A]">Ubicación exacta en el mapa</p>
                <p className="text-[11px] text-gray-500 mt-1">Haz clic en el mapa o arrastra el pin hasta tu ubicación real.</p>
              </div>
              <button
                type="button"
                onClick={usarMiUbicacion}
                className="px-3 py-2 rounded-xl bg-[#F5ECD7] text-[#7A4020] text-xs font-semibold hover:bg-[#E8D8BF] transition-colors"
              >
                {ubicandoMapa ? "Ubicando..." : "Usar mi ubicación exacta"}
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[#E8D8BF] shadow-[0_8px_22px_rgba(77,48,24,0.08)]" style={{ height: "280px" }}>
              <MapContainer center={posicionMapa} zoom={tieneUbicacionExacta ? 17 : 15} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ActualizarVistaMapa centro={posicionMapa} />
                <PinUbicacion
                  posicion={posicionMapa}
                  onChange={({ latitud, longitud }) => setForm((prev) => ({ ...prev, latitud, longitud }))}
                />
              </MapContainer>
            </div>

            <div className="mt-3 flex flex-col gap-1 text-xs">
              <span className="text-[#3B1F0A] font-semibold">
                {tieneUbicacionExacta
                  ? `Lat: ${form.latitud} · Lng: ${form.longitud}`
                  : "Aún no has fijado una ubicación exacta"}
              </span>
              <span className="text-gray-500">Si no marcas el punto, el sistema usará una ubicación aproximada basada en dirección y municipio.</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Teléfono *</label>
            <input
              type="tel"
              required
              placeholder="+57 300 000 0000"
              value={form.telefono}
              onChange={(e) => handleChange("telefono", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Horario de atención *</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Apertura</label>
                <input
                  type="time"
                  value={form.horarioApertura}
                  onChange={(e) => handleChange("horarioApertura", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cierre</label>
                <input
                  type="time"
                  value={form.horarioCierre}
                  onChange={(e) => handleChange("horarioCierre", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Productos que compras / Servicios que ofreces *</label>
            <p className="text-xs text-gray-400 mb-3">Selecciona todos los que apliquen</p>
            <div className="flex flex-wrap gap-2">
              {SERVICIOS_OPCIONES.map((servicio) => (
                <button
                  key={servicio}
                  type="button"
                  onClick={() => toggleServicio(servicio)}
                  className={`px-3 py-2 rounded-full text-xs font-semibold border-2 transition-all ${
                    form.servicios.includes(servicio)
                      ? "border-[#C8814A] bg-[#C8814A]/10 text-[#3B1F0A]"
                      : "border-gray-200 bg-white text-gray-500 hover:border-[#C8814A]/40"
                  }`}
                >
                  {servicio}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
              Descripción <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              placeholder="Cuéntale al admin sobre tu empresa, experiencia o lo que te diferencia..."
              value={form.descripcion}
              onChange={(e) => handleChange("descripcion", e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.descripcion.length}/300</p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold shadow-[0_8px_18px_rgba(185,28,28,0.08)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white text-sm font-bold shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #3D1F0F, #7A4020)" }}
          >
            {loading ? "Enviando..." : "Enviar para aprobación"}
          </button>
        </form>
      </div>
    </div>
  );
}

