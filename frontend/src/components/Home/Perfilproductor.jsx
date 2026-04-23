import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';


export default function PerfilProductor() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario, actualizarUsuario } = useAuth();

  const [modo, setModo] = useState('ver');
  const [datos, setDatos] = useState({ nombre: '', apellido: '', celular: '' });
  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' });
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (usuario) {
      setDatos({
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        celular: usuario.celular || '',
      });
    }
  }, [usuario]);

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

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[#2C1A0E] text-2xl font-bold">Mi perfil</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona tu información personal</p>
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-semibold ${
            mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
          </div>
        )}

        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* Banner y avatar */}
          <div className="h-24 bg-linear-to-r from-[#3D1F0F] to-[#7A4020] relative">
            <div className="absolute -bottom-8 left-8">
              <div className="w-16 h-16 rounded-2xl bg-[#C8A96E] flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white">
                {iniciales}
              </div>
            </div>
          </div>

          <div className="pt-12 px-8 pb-8">
            {/* Nombre y rol */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-[#2C1A0E] text-xl font-bold">{usuario?.nombre} {usuario?.apellido}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-[#F5ECD7] text-[#7A4020] text-xs px-3 py-1 rounded-full font-semibold">
                    ☕ Productor
                  </span>
                  <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                    ● Activo
                  </span>
                </div>
              </div>
              {modo === 'ver' && (
                <button
                  onClick={() => setModo('editar')}
                  className="bg-[#F5ECD7] text-[#2C1A0E] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#E0D0B0] transition-colors">
                  <i className="fa-solid fa-pen mr-2"></i>Editar
                </button>
              )}
            </div>

            {/* MODO VER */}
            {modo === 'ver' && (
              <div className="space-y-4">
                <Campo label="Nombre" valor={usuario?.nombre} />
                <Campo label="Apellido" valor={usuario?.apellido} />
                <Campo label="Correo electrónico" valor={usuario?.email} />
                <Campo label="Celular" valor={usuario?.celular || 'No registrado'} />
                <Campo label="Rol" valor="Productor" />
                <div className="rounded-2xl bg-[#F8F3E8] border border-[#E6D6BB] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A735B]">
                    Predicciones
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#2C1A0E]">
                    Consulta el comportamiento esperado del precio antes de vender.
                  </p>
                  <Link
                    to="/predicciones"
                    className="mt-3 inline-flex items-center rounded-full bg-[#2C1A0E] px-4 py-2 text-xs font-bold text-white hover:bg-[#3D1F0F] transition-colors"
                  >
                    Abrir predicciones
                  </Link>
                </div>
                <button
                  onClick={() => setModo('password')}
                  className="mt-4 w-full border border-[#C8A96E]/40 text-[#7A4020] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#F5ECD7] transition-colors">
                  <i className="fa-solid fa-lock mr-2"></i>Cambiar contraseña
                </button>
              </div>
            )}

            {/* MODO EDITAR */}
            {modo === 'editar' && (
              <form onSubmit={handleGuardarDatos} className="space-y-4">
                <InputField label="Nombre" value={datos.nombre} onChange={v => setDatos({ ...datos, nombre: v })} />
                <InputField label="Apellido" value={datos.apellido} onChange={v => setDatos({ ...datos, apellido: v })} />
                <InputField label="Celular" value={datos.celular} onChange={v => setDatos({ ...datos, celular: v })} placeholder="+57 300 000 0000" />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModo('ver')}
                    className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-[#2C1A0E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors disabled:opacity-60">
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            )}

            {/* MODO CAMBIAR CONTRASEÑA */}
            {modo === 'password' && (
              <form onSubmit={handleCambiarPassword} className="space-y-4">
                <InputField label="Contraseña actual" value={passwords.actual} onChange={v => setPasswords({ ...passwords, actual: v })} type="password" />
                <InputField label="Nueva contraseña" value={passwords.nueva} onChange={v => setPasswords({ ...passwords, nueva: v })} type="password" />
                <InputField label="Confirmar nueva contraseña" value={passwords.confirmar} onChange={v => setPasswords({ ...passwords, confirmar: v })} type="password" />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModo('ver')}
                    className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-[#2C1A0E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors disabled:opacity-60">
                    {loading ? 'Guardando...' : 'Cambiar contraseña'}
                  </button>
                </div>
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
          <button
            type="button"
            onClick={() => setVerPassword(!verPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C8A96E] transition-colors">
            <i className={`fa-solid ${verPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
          </button>
        )}
      </div>
    </div>
  );
}


