import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

const SERVICIOS_OPCIONES = [
  'Café pergamino seco', 'Café especial', 'Café orgánico', 'Café verde',
  'Pasilla', 'Cacao', 'Maíz', 'Fique', 'Otros productos agrícolas'
];

const MUNICIPIOS = [
  'El Pital', 'Pitalito', 'Acevedo', 'La Argentina', 'Tarqui',
  'Suaza', 'Palestina', 'Elías', 'Saladoblanco', 'Isnos'
];

export default function CompletarPerfil() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [usuarioId, setUsuarioId] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    nombreempresa: '',
    tipoempresa: 'independiente',
    direccion: '',
    municipio: 'El Pital',
    telefono: '',
    horarioApertura: '07:00',
    horarioCierre: '17:00',
    descripcion: '',
    servicios: [],
  });

  useEffect(() => {
    const t = localStorage.getItem('token');
    const id = localStorage.getItem('usuarioId');
    const rol = localStorage.getItem('rol');
    if (!t || !id || rol !== 'comprador') {
      setCargandoSesion(false);
      return;
    }
    setToken(t);
    setUsuarioId(id);
    setCargandoSesion(false);
  }, []);

  if (cargandoSesion) return (
    <div className="min-h-screen bg-[#3D1F0F] flex items-center justify-center">
      <p className="text-white">Cargando...</p>
    </div>
  );

  if (!token) return <Navigate to="/login" replace />;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleServicio = (servicio) => {
    setForm(prev => ({
      ...prev,
      servicios: prev.servicios.includes(servicio)
        ? prev.servicios.filter(s => s !== servicio)
        : [...prev.servicios, servicio]
    }));
  };

  const validarNombreEmpresa = (nombre) => {
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.&]+$/;
    return soloLetras.test(nombre.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.nombreempresa.trim()) {
      setError('El nombre de la empresa es obligatorio');
      return;
    }
    if (!validarNombreEmpresa(form.nombreempresa)) {
      setError('El nombre de la empresa solo puede contener letras, espacios, puntos y &');
      return;
    }
    if (!form.direccion.trim()) {
      setError('La dirección es obligatoria');
      return;
    }
    if (!form.telefono.trim()) {
      setError('El teléfono es obligatorio');
      return;
    }
    if (form.servicios.length === 0) {
      setError('Selecciona al menos un producto o servicio que ofreces');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/comprador`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message);
        return;
      }
      setSuccess(true);
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-[#3D1F0F] flex items-center justify-center px-4">
      <div className="bg-[#FAF7F2] rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-black text-[#3B1F0A] mb-3">¡Perfil enviado!</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-2">
          Un administrador revisará tu empresa y activará tu cuenta pronto.
        </p>
        <p className="text-xs text-gray-400 mb-8">
          Te notificaremos por correo cuando tu cuenta esté activa.
        </p>
        <button onClick={() => navigate('/login')}
          className="w-full py-3.5 rounded-xl text-white text-sm font-bold shadow-lg"
          style={{ background: 'linear-gradient(135deg, #C8814A, #7A4020)' }}>
          ☕ Volver al inicio de sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#3D1F0F] flex flex-col lg:flex-row">

      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 py-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(200,129,74,0.15) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 left-10 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(200,129,74,0.08) 0%, transparent 70%)' }} />

        <div className="flex items-center gap-3 mb-16 relative z-10">
          <div className="w-12 h-12 bg-[#C8814A] rounded-xl flex items-center justify-center text-2xl shadow-lg">☕</div>
          <span className="text-5xl font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>CoffePrice</span>
        </div>

        <h1 className="text-6xl font-black text-white leading-tight mb-5 relative z-10" style={{ fontFamily: 'Georgia, serif' }}>
          Casi listo <br />
          <span className="text-[#E8A870] italic text-5xl">para comprar café</span>
        </h1>

        <p className="text-white/65 text-xl leading-relaxed max-w-sm mb-10 relative z-10">
          Completa los datos de tu empresa para que los productores puedan encontrarte.
        </p>

        <div className="flex flex-col gap-3 relative z-10">
          <div className="bg-[#C8814A]/20 rounded-2xl px-5 py-4 border border-[#C8814A]/30">
            <p className="text-white/60 text-xs mb-1">Estado de tu cuenta</p>
            <p className="text-[#E8A870] font-bold text-sm">⏳ Pendiente de aprobación del admin</p>
          </div>
          <div className="bg-white/10 rounded-2xl px-5 py-4 border border-white/10">
            <p className="text-white/60 text-xs mb-1">¿Qué sigue?</p>
            <p className="text-white font-semibold text-sm">Un admin revisará tu empresa y te activará la cuenta</p>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="w-full lg:w-1/2 bg-[#FAF7F2] flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 overflow-y-auto">

        {/* Logo móvil */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="w-10 h-10 bg-[#C8814A] rounded-xl flex items-center justify-center text-xl">☕</div>
          <span className="text-3xl font-black text-[#3B1F0A]" style={{ fontFamily: 'Georgia, serif' }}>CoffePrice</span>
        </div>

        <div className="mb-6">
          <span className="text-xs font-bold text-[#C8814A] bg-[#C8814A]/10 px-3 py-1 rounded-full">🏪 Perfil de comprador</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-[#3B1F0A] mb-1.5" style={{ fontFamily: 'Georgia, serif' }}>
          Datos de tu empresa
        </h2>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          Esta información será visible para los productores. El admin revisará tu perfil antes de activarlo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Nombre empresa */}
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
              Nombre de la empresa *
            </label>
            <input type="text" required
              placeholder="Ej: Cooperativa El Pital"
              value={form.nombreempresa}
              onChange={e => handleChange('nombreempresa', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50" />
            <p className="text-xs text-gray-400 mt-1">Solo letras, espacios, puntos y &</p>
          </div>

          {/* Tipo de empresa */}
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
              Tipo de empresa *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { value: 'cooperativa', label: '🤝 Cooperativa' },
                { value: 'trilladora', label: '🏭 Trilladora' },
                { value: 'independiente', label: '👤 Independiente' },
                { value: 'exportadora', label: '✈️ Exportadora' },
                { value: 'otro', label: '🏢 Otro' },
              ].map(tipo => (
                <button key={tipo.value} type="button"
                  onClick={() => handleChange('tipoempresa', tipo.value)}
                  className={`py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition-all text-left ${
                    form.tipoempresa === tipo.value
                      ? 'border-[#C8814A] bg-[#C8814A]/10 text-[#3B1F0A]'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-[#C8814A]/40'
                  }`}>
                  {tipo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Municipio */}
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
              Municipio *
            </label>
            <select value={form.municipio}
              onChange={e => handleChange('municipio', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50">
              {MUNICIPIOS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
              Dirección del punto físico *
            </label>
            <input type="text" required
              placeholder="Ej: Calle 5 #10-20, El Pital, Huila"
              value={form.direccion}
              onChange={e => handleChange('direccion', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50" />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
              Teléfono *
            </label>
            <input type="tel" required
              placeholder="+57 300 000 0000"
              value={form.telefono}
              onChange={e => handleChange('telefono', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50" />
          </div>

          {/* Horario */}
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
              Horario de atención *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Apertura</label>
                <input type="time" value={form.horarioApertura}
                  onChange={e => handleChange('horarioApertura', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cierre</label>
                <input type="time" value={form.horarioCierre}
                  onChange={e => handleChange('horarioCierre', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50" />
              </div>
            </div>
          </div>

          {/* Productos y servicios */}
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
              Productos que compras / Servicios que ofreces *
            </label>
            <p className="text-xs text-gray-400 mb-3">Selecciona todos los que apliquen</p>
            <div className="flex flex-wrap gap-2">
              {SERVICIOS_OPCIONES.map(s => (
                <button key={s} type="button"
                  onClick={() => toggleServicio(s)}
                  className={`px-3 py-2 rounded-full text-xs font-semibold border-2 transition-all ${
                    form.servicios.includes(s)
                      ? 'border-[#C8814A] bg-[#C8814A]/10 text-[#3B1F0A]'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-[#C8814A]/40'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción opcional */}
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">
              Descripción <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              placeholder="Cuéntale a los productores sobre tu empresa, experiencia, o lo que te diferencia..."
              value={form.descripcion}
              onChange={e => handleChange('descripcion', e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-[#C8814A]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8814A]/50 resize-none" />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.descripcion.length}/300</p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
              ❌ {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl text-white text-sm font-bold shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #3D1F0F, #7A4020)' }}>
            {loading ? 'Enviando...' : '📋 Enviar para aprobación'}
          </button>

        </form>
      </div>
    </div>
  );
}
