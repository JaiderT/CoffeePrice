import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContex.jsx';

export default function PerfilAdmin() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario } = useAuth();
  const token = localStorage.getItem('token');

  const [modo, setModo] = useState('ver');
  const [datos, setDatos] = useState({ nombre: '', apellido: '', celular: '' });
  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' });
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (usuario) {
      setDatos({ nombre: usuario.nombre || '', apellido: usuario.apellido || '', celular: usuario.celular || '' });
    }
  }, [usuario]);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3500);
  };

  const handleGuardarDatos = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API_URL}/api/usuario/perfil`, datos, {
        headers: { Authorization: `Bearer ${token}` }
      });
      mostrarMensaje('exito', 'Datos actualizados correctamente');
      setModo('ver');
    } catch {
      mostrarMensaje('error', 'Error al actualizar los datos');
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
        passwordActual: passwords.actual,
        passwordNueva: passwords.nueva,
      }, { headers: { Authorization: `Bearer ${token}` } });
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

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[#2C1A0E] text-2xl font-bold">Mi perfil</h1>
          <p className="text-gray-500 text-sm mt-1">Cuenta de administrador</p>
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-semibold ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
          </div>
        )}

        {/* Badge admin */}
        <div className="bg-[#2C1A0E] rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#C8A96E] flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {iniciales}
          </div>
          <div>
            <p className="text-white font-bold text-lg">{usuario?.nombre} {usuario?.apellido}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-[#C8A96E] text-[#2C1A0E] text-xs px-3 py-1 rounded-full font-bold">
                ⚙️ Administrador
              </span>
              <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full font-semibold">
                ● Activo
              </span>
            </div>
          </div>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[#2C1A0E] font-bold">Información personal</h3>
            {modo === 'ver' && (
              <button onClick={() => setModo('editar')}
                className="bg-[#F5ECD7] text-[#2C1A0E] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#E0D0B0] transition-colors">
                ✏️ Editar
              </button>
            )}
          </div>

          <div className="px-8 py-6">
            {modo === 'ver' && (
              <div className="space-y-4">
                <Campo label="Nombre" valor={usuario?.nombre} />
                <Campo label="Apellido" valor={usuario?.apellido} />
                <Campo label="Correo electrónico" valor={usuario?.email} />
                <Campo label="Celular" valor={usuario?.celular || 'No registrado'} />
                <Campo label="Rol" valor="Administrador" />
                <button onClick={() => setModo('password')}
                  className="mt-4 w-full border border-[#C8A96E]/40 text-[#7A4020] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#F5ECD7] transition-colors">
                  🔐 Cambiar contraseña
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

        {/* Info permisos */}
        <div className="mt-6 bg-[#2C1A0E]/5 border border-[#C8A96E]/20 rounded-2xl p-5">
          <p className="text-xs font-bold text-[#7A4020] uppercase mb-3">Permisos de administrador</p>
          <div className="grid grid-cols-2 gap-2">
            {['Gestionar usuarios', 'Aprobar compradores', 'Ver todos los precios', 'Gestionar contenido'].map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[#2C1A0E]">
                <span className="text-green-500">✓</span> {p}
              </div>
            ))}
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
  return (
    <div>
      <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 bg-white text-sm text-[#3B1F0A] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8A96E]/50"
      />
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
