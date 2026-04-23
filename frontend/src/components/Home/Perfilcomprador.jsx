import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';

export default function PerfilComprador() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario, actualizarUsuario } = useAuth();
  const usuarioId = localStorage.getItem('usuarioId');

  const [modo, setModo] = useState('ver');
  const [comprador, setComprador] = useState(null);
  const [datos, setDatos] = useState({ nombre: '', apellido: '', celular: '' });
  const [empresa, setEmpresa] = useState({
    nombreempresa: '', direccion: '', telefono: '',
    horarioApertura: '08:00', horarioCierre: '17:00'
  });
  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' });
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (usuario) {
      setDatos({ nombre: usuario.nombre || '', apellido: usuario.apellido || '', celular: usuario.celular || '' });
    }
    const obtenerComprador = async () => {
      try {
        if (!usuarioId) return;
        const { data } = await axios.get(`${API_URL}/api/comprador/usuario/${usuarioId}`, { withCredentials: true });
        setComprador(data);
        setEmpresa({
          nombreempresa: data.nombreempresa || '',
          direccion: data.direccion || '',
          telefono: data.telefono || '',
          horarioApertura: data.horarioApertura || '08:00',
          horarioCierre: data.horarioCierre || '17:00',
        });
      } catch (error) {
        console.error('Error al obtener comprador:', error);
      }
    };
    obtenerComprador();
  }, [API_URL, usuarioId, usuario]);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3500);
  };

  const handleGuardarDatos = async (e) => {
  e.preventDefault();
  const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
  if (!soloLetras.test(datos.nombre.trim())) {
    mostrarMensaje('error', 'El nombre solo puede contener letras');
    return;
  }
  if (!soloLetras.test(datos.apellido.trim())) {
    mostrarMensaje('error', 'El apellido solo puede contener letras');
    return;
  }
  setLoading(true);
  try {
    await axios.put(`${API_URL}/api/usuario/perfil`, datos, { withCredentials: true });
    actualizarUsuario(datos);
    mostrarMensaje('exito', 'Datos actualizados correctamente');
    setModo('ver');
  } catch {
    mostrarMensaje('error', 'Error al actualizar los datos');
  } finally {
    setLoading(false);
  }
};

  const handleGuardarEmpresa = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API_URL}/api/comprador/${comprador._id}`, {
        ...empresa,
        latitud: ubicacion.lat,
        longitud: ubicacion.lng,
      }, { withCredentials: true });
      mostrarMensaje('exito', 'Datos de empresa actualizados');
      setModo('ver');
      const { data } = await axios.get(`${API_URL}/api/comprador/usuario/${usuarioId}`, { withCredentials: true });
      setComprador(data);
      setEmpresa({
        nombreempresa: data.nombreempresa || '',
        direccion: data.direccion || '',
        telefono: data.telefono || '',
        horarioApertura: data.horarioApertura || '08:00',
        horarioCierre: data.horarioCierre || '17:00',
      });
    } catch {
      mostrarMensaje('error', 'Error al actualizar la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (passwords.nueva !== passwords.confirmar) {
      mostrarMensaje('error', 'Las contraseñas nuevas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${API_URL}/api/usuario/password`, {
        passwordactual: passwords.actual,
        passwordnueva: passwords.nueva,
      }, { withCredentials: true });
      mostrarMensaje('exito', 'Contraseña actualizada correctamente');
      setPasswords({ actual: '', nueva: '', confirmar: '' });
      setModo('ver');
    } catch {
      mostrarMensaje('error', 'Contraseña actual incorrecta');
    } finally {
      setLoading(false);
    }
  };

  const iniciales = usuario
    ? `${usuario.nombre?.[0] || ''}${usuario.apellido?.[0] || ''}`.toUpperCase()
    : '?';

  return (
    <div className="min-h-screen bg-[#F5ECD7] p-6 md:p-10">
      <div className="max-w-2xl mx-auto">

        <div className="mb-8">
          <h1 className="text-[#2C1A0E] text-2xl font-bold">Mi perfil</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona tu información y la de tu empresa</p>
        </div>

        {mensaje && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-semibold ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
          </div>
        )}

        {/* Card personal */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="h-24 bg-linear-to-r from-[#3D1F0F] to-[#C8A96E] relative">
            <div className="absolute -bottom-8 left-8">
              <div className="w-16 h-16 rounded-2xl bg-[#2C1A0E] flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white">
                {iniciales}
              </div>
            </div>
          </div>

          

          <div className="pt-12 px-8 pb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-[#2C1A0E] text-xl font-bold">{usuario?.nombre} {usuario?.apellido}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-[#F5ECD7] text-[#7A4020] text-xs px-3 py-1 rounded-full font-semibold">
                    🏪 Comprador
                  </span>
                  <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                    ● Activo
                  </span>
                </div>
                
              </div>
              
              {modo === 'ver' && (
                <button onClick={() => setModo('editar')}
                  className="bg-[#F5ECD7] text-[#2C1A0E] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#E0D0B0] transition-colors">
                  <i className="fa-solid fa-pen mr-2"></i>Editar
                </button>
              )}
            </div>

            {modo === 'ver' && (
              <div className="space-y-4">
                <Campo label="Nombre" valor={usuario?.nombre} />
                <Campo label="Apellido" valor={usuario?.apellido} />
                <Campo label="Correo electrónico" valor={usuario?.email} />
                <Campo label="Celular" valor={usuario?.celular || 'No registrado'} />
                <button onClick={() => setModo('password')}
                  className="mt-4 w-full border border-[#C8A96E]/40 text-[#7A4020] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#F5ECD7] transition-colors">
                  <i className="fa-solid fa-lock mr-2"></i>Cambiar contraseña
                </button>
              </div>
            )}

            {modo === 'editar' && (
              <form onSubmit={handleGuardarDatos} className="space-y-4">
                <InputField label="Nombre" value={datos.nombre} onChange={v => setDatos({ ...datos, nombre: v })} />
                <InputField label="Apellido" value={datos.apellido} onChange={v => setDatos({ ...datos, apellido: v })} />
                <InputField label="Celular" value={datos.celular} onChange={v => setDatos({ ...datos, celular: v })} placeholder="+57 300 000 0000" />
                <BotonesForm onCancel={() => setModo('ver')} loading={loading} />
              </form>
            )}

            {modo === 'password' && (
              <form onSubmit={handleCambiarPassword} className="space-y-4">
                <InputField label="Contraseña actual" value={passwords.actual} onChange={v => setPasswords({ ...passwords, actual: v })} type="password" />
                <InputField label="Nueva contraseña" value={passwords.nueva} onChange={v => setPasswords({ ...passwords, nueva: v })} type="password" />
                <InputField label="Confirmar nueva contraseña" value={passwords.confirmar} onChange={v => setPasswords({ ...passwords, confirmar: v })} type="password" />
                <BotonesForm onCancel={() => setModo('ver')} loading={loading} />
              </form>
            )}
          </div>
        </div>

        {/* Card empresa */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-[#2C1A0E] font-bold">Datos de la empresa</h3>
              <p className="text-gray-400 text-xs mt-0.5">Visible para los caficultores</p>
            </div>
            {modo === 'ver' && (
              <button onClick={() => setModo('empresa')}
                className="bg-[#F5ECD7] text-[#2C1A0E] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#E0D0B0] transition-colors">
                <i className="fa-solid fa-pen mr-2"></i>Editar
              </button>
            )}
          </div>

          <div className="px-8 py-6">
            {modo !== 'empresa' ? (
              <div className="space-y-4">
                <Campo label="Nombre de la empresa" valor={comprador?.nombreempresa || '—'} />
                <Campo label="Dirección" valor={comprador?.direccion || '—'} />
                <Campo label="Teléfono" valor={comprador?.telefono || 'No registrado'} />
                <Campo label="Hora de apertura" valor={comprador?.horarioApertura || '08:00'} />
                <Campo label="Hora de cierre" valor={comprador?.horarioCierre || '17:00'} />
              </div>
            ) : (
              <form onSubmit={handleGuardarEmpresa} className="space-y-4">
                <InputField label="Nombre de la empresa" value={empresa.nombreempresa} onChange={v => setEmpresa({ ...empresa, nombreempresa: v })} />
                <InputField label="Dirección" value={empresa.direccion} onChange={v => setEmpresa({ ...empresa, direccion: v })} />
                <InputField label="Teléfono" value={empresa.telefono} onChange={v => setEmpresa({ ...empresa, telefono: v })} placeholder="+57 300 000 0000" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Hora de apertura</label>
                    <input type="time" value={empresa.horarioApertura}
                      onChange={e => setEmpresa({ ...empresa, horarioApertura: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 bg-white text-sm text-[#3B1F0A] focus:outline-none focus:ring-2 focus:ring-[#C8A96E]/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Hora de cierre</label>
                    <input type="time" value={empresa.horarioCierre}
                      onChange={e => setEmpresa({ ...empresa, horarioCierre: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 bg-white text-sm text-[#3B1F0A] focus:outline-none focus:ring-2 focus:ring-[#C8A96E]/50" />
                  </div>
                </div>
                <BotonesForm onCancel={() => setModo('ver')} loading={loading} />
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function Campo({ label, valor }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-400 uppercase">{label}</span>
      <span className="text-[#2C1A0E] text-sm font-medium">{valor}</span>
      <div className="h-px bg-gray-100" />
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder = '' }) {
  const [verPassword, setVerPassword] = useState(false);
  const esPassword = type === 'password';

  return (
    <div>
      <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">{label}</label>
      <div className="relative">
        <input
          type={esPassword ? (verPassword ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8A96E]/50 pr-10"
        />
        {esPassword && (
          <button type="button" onClick={() => setVerPassword(!verPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C8814A] transition-colors">
            {verPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function BotonesForm({ onCancel, loading }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel}
        className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
        Cancelar
      </button>
      <button type="submit" disabled={loading}
        className="flex-1 bg-[#2C1A0E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors disabled:opacity-60">
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}


