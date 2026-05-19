import { useEffect, useState } from 'react';
import { AuthContext } from './AuthContext.js';
import { guardarUsuarioLocal, limpiarUsuarioLocal, leerUsuarioLocal } from '../utils/authStorage.js';

const API_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => leerUsuarioLocal());
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    async function hidratarSesion() {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('No hay sesion activa');
        }

        const userData = await response.json();
        if (!activo) return;

        const usuarioSesion = {
          id: userData._id,
          rol: userData.rol,
          nombre: userData.nombre,
          apellido: userData.apellido,
          celular: userData.celular,
          email: userData.email,
          estado: userData.estado || 'activo',
        };

        guardarUsuarioLocal(usuarioSesion);
        setUsuario(usuarioSesion);
      } catch {
        if (!activo) return;
        limpiarUsuarioLocal();
        setUsuario(null);
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    hidratarSesion();
    return () => {
      activo = false;
    };
  }, []);

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
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error al cerrar sesion:', error);
    } finally {
      limpiarUsuarioLocal();
      setUsuario(null);
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

  return (
    <AuthContext.Provider value={{ usuario, login, logout, actualizarUsuario, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}
