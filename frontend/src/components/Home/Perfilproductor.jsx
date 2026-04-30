import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';

export default function PerfilProductor() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario, actualizarUsuario, logout } = useAuth();
  const navigate = useNavigate();

  const [modo, setModo] = useState('ver');
  const [datos, setDatos] = useState({ nombre: '', apellido: '', celular: '' });
  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' });
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalAccion, setModalAccion] = useState(null); // 'eliminar' | 'suspender'

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

  const handleEliminarCuenta = async () => {
    try {
      await axios.delete(`${API_URL}/api/usuario/perfil`, { withCredentials: true });
      logout();
      navigate('/login');
    } catch {
      mostrarMensaje('error', 'Error al eliminar la cuenta');
      setModalAccion(null);
    }
  };

  const handleSuspenderCuenta = async () => {
    try {
      await axios.put(`${API_URL}/api/usuario/suspender`, {}, { withCredentials: true });
      logout();
      navigate('/login');
    } catch {
      mostrarMensaje('error', 'Error al suspender la cuenta');
      setModalAccion(null);
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
          <p className="text-gray-500 text-sm mt-1">Gestiona tu información personal</p>
        </div>

        {mensaje && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-semibold ${
            mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-24 bg-linear-to-r from-[#3D1F0F] to-[#7A4020] relative">
            <div className="absolute -bottom-8 left-8">
              <div className="w-16 h-16 rounded-2xl bg-[#C8A96E] flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white">
                {iniciales}
              </div>
            </div>
          </div>

          <div className="pt-12 px-8 pb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-[#2C1A0E] text-xl font-bold">{usuario?.nombre} {usuario?.apellido}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-[#F5ECD7] text-[#7A4020] text-xs px-3 py-1 rounded-full font-semibold">☕ Productor</span>
                  <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">● Activo</span>
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
                <Campo label="Rol" valor="Productor" />
                <div className="rounded-2xl bg-[#F8F3E8] border border-[#E6D6BB] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A735B]">Predicciones</p>
                  <p className="mt-2 text-sm font-semibold text-[#2C1A0E]">
                    Consulta el comportamiento esperado del precio antes de vender.
                  </p>
                  <Link to="/predicciones"
                    className="mt-3 inline-flex items-center rounded-full bg-[#2C1A0E] px-4 py-2 text-xs font-bold text-white hover:bg-[#3D1F0F] transition-colors">
                    Abrir predicciones
                  </Link>
                </div>
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

        {/* Zona de cuenta */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-100">
            <h3 className="text-[#2C1A0E] font-bold">Gestión de cuenta</h3>
            <p className="text-gray-400 text-xs mt-0.5">Opciones para suspender o eliminar tu cuenta</p>
          </div>
          <div className="px-8 py-6 space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-[#2C1A0E]">Suspender cuenta</p>
                <p className="text-xs text-gray-400 mt-0.5">Tu cuenta quedará inactiva temporalmente</p>
              </div>
              <button onClick={() => setModalAccion('suspender')}
                className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-yellow-200 transition-colors">
                ⏸ Suspender
              </button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-red-600">Eliminar cuenta</p>
                <p className="text-xs text-gray-400 mt-0.5">Esta acción no se puede deshacer</p>
              </div>
              <button onClick={() => setModalAccion('eliminar')}
                className="bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-red-200 transition-colors">
                🗑 Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal suspender */}
      {modalAccion === 'suspender' && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-80 shadow-xl text-center">
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-pause text-yellow-500 text-2xl"></i>
            </div>
            <h3 className="text-[#2C1A0E] font-bold text-lg mb-2">¿Suspender tu cuenta?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Tu cuenta quedará inactiva. Para reactivarla deberás contactar al administrador.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalAccion(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSuspenderCuenta}
                className="flex-1 bg-yellow-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-yellow-600 transition-colors">
                Sí, suspender
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {modalAccion === 'eliminar' && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-80 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-user-slash text-red-400 text-2xl"></i>
            </div>
            <h3 className="text-[#2C1A0E] font-bold text-lg mb-2">¿Eliminar tu cuenta?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Esta acción no se puede deshacer. Perderás acceso permanentemente a tu cuenta.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalAccion(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleEliminarCuenta}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C8A96E] transition-colors">
            <i className={`fa-solid ${verPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
          </button>
        )}
      </div>
    </div>
  );
}

