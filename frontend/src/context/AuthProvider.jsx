import { useState } from 'react';
import { AuthContext } from './AuthContext.js';
import { guardarUsuarioLocal, limpiarUsuarioLocal, leerUsuarioLocal } from '../utils/authStorage.js';

const API_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => leerUsuarioLocal());

  const login = (userData) => {
    const usuarioSesion = {
      id: userData.id || userData._id,
      rol: userData.rol,
      nombre: userData.nombre,
      apellido: userData.apellido,
      celular: userData.celular,
      email: userData.email,
      estado: userData.estado || 'activo',
    };
    guardarUsuarioLocal(usuarioSesion);
    setUsuario(usuarioSesion);
  };

  const logout = async () => {
    limpiarUsuarioLocal();
    setUsuario(null);
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const actualizarUsuario = (nuevosDatos) => {
    setUsuario((prev) => {
      if (!prev) return prev;
      const actualizado = { ...prev, ...nuevosDatos };
      guardarUsuarioLocal(actualizado);
      return actualizado;
    });
  };

  // cargando siempre false — no hay fetch asíncrono
  return (
    <AuthContext.Provider value={{ usuario, login, logout, actualizarUsuario, cargando: false }}>
      {children}
    </AuthContext.Provider>
  );
}
