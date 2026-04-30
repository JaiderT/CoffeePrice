import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';
import { useNavigate } from 'react-router-dom';

export default function CuentaSuspendida() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario, actualizarUsuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleReactivar = async () => {
    try {
      await axios.put(`${API_URL}/api/usuario/reactivar`, {}, { withCredentials: true });
      actualizarUsuario({ estado: 'activo' });
      navigate('/');
    } catch {
      alert('Error al reactivar la cuenta. Intenta de nuevo.');
    }
  };

  const handleCerrarSesion = async () => {
    await logout();
    navigate('/login');
  };

  const iniciales = usuario
    ? `${usuario.nombre?.[0] || ''}${usuario.apellido?.[0] || ''}`.toUpperCase()
    : '?';

  return (
    <div className="min-h-screen bg-[#F5ECD7] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">

        <div className="w-20 h-20 rounded-2xl bg-[#C8A96E] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
          {iniciales}
        </div>

        <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-pause text-orange-500 text-2xl"></i>
        </div>

        <h1 className="text-[#2C1A0E] text-xl font-bold mb-2">Cuenta suspendida</h1>

        <p className="text-gray-400 text-sm mb-2">
          Hola <span className="font-semibold text-[#2C1A0E]">{usuario?.nombre}</span>, suspendiste tu cuenta temporalmente.
        </p>

        <p className="text-gray-400 text-sm mb-8">
          Puedes reactivarla en cualquier momento para volver a usar CoffePrice con normalidad.
        </p>

        <div className="space-y-3">
          <button onClick={handleReactivar}
            className="w-full bg-[#2C1A0E] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors">
            ✅ Reactivar mi cuenta
          </button>
          <button onClick={handleCerrarSesion}
            className="w-full border border-gray-200 text-gray-500 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
            Cerrar sesión
          </button>
        </div>

        <p className="text-xs text-gray-300 mt-6">
          Si crees que esto es un error, contacta al administrador.
        </p>
      </div>
    </div>
  );
}
