import { useEffect, useState } from 'react';
import { AuthContext } from './AuthContext.js';

const API_URL = import.meta.env.VITE_API_URL;

function guardarUsuarioLocal(usuario) {
  if (!usuario) return;
  localStorage.setItem('rol', usuario.rol || '');
  localStorage.setItem('name', usuario.nombre || '');
  localStorage.setItem('apellido', usuario.apellido || '');
  localStorage.setItem('usuarioId', usuario.id || '');
  localStorage.setItem('celular', usuario.celular || '');
  localStorage.setItem('email', usuario.email || '');
}

function limpiarUsuarioLocal() {
  localStorage.removeItem('token');
  localStorage.removeItem('rol');
  localStorage.removeItem('name');
  localStorage.removeItem('apellido');
  localStorage.removeItem('usuarioId');
  localStorage.removeItem('celular');
  localStorage.removeItem('email');
}

export function AuthProvider({ children }) {
  // CORREGIDO: useState con función inicializadora para precarga instantánea desde localStorage
  const [usuario, setUsuario] = useState(() => {
    const rol = localStorage.getItem('rol');
    const id = localStorage.getItem('usuarioId');
    // Si no hay rol o id guardados, no hay sesión previa
    if (!rol || !id) return null;
    return {
      id,
      rol,
      nombre: localStorage.getItem('name') || '',
      apellido: localStorage.getItem('apellido') || '',
      celular: localStorage.getItem('celular') || '',
      email: localStorage.getItem('email') || '',
    };
  });
  
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const inicializarSesion = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
        });

        if (!response.ok) {
          limpiarUsuarioLocal();
          setUsuario(null);
          return;
        }

        const data = await response.json();
        const usuarioSesion = {
          id: data._id,
          rol: data.rol,
          nombre: data.nombre,
          apellido: data.apellido,
          celular: data.celular,
          email: data.email,
        };

        guardarUsuarioLocal(usuarioSesion);
        setUsuario(usuarioSesion);
      } catch {
        limpiarUsuarioLocal();
        setUsuario(null);
      } finally {
        setCargando(false);
      }
    };

    inicializarSesion();
  }, []);

  const login = (userData) => {
    const usuarioSesion = {
      id: userData.id || userData._id,
      rol: userData.rol,
      nombre: userData.nombre,
      apellido: userData.apellido,
      celular: userData.celular,
      email: userData.email,
    };

    guardarUsuarioLocal(usuarioSesion);
    setUsuario(usuarioSesion);
  };

  const logout = async () => {
    limpiarUsuarioLocal();
    setUsuario(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Error al cerrar sesion:', await response.text());
      }
    } catch (error) {
      console.error('Error al cerrar sesion:', error);
    }
  };

  const actualizarUsuario = (nuevosDatos) => {
    setUsuario((prev) => {
      if (!prev) return prev;
      const usuarioActualizado = { ...prev, ...nuevosDatos };
      guardarUsuarioLocal(usuarioActualizado);
      return usuarioActualizado;
    });
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, actualizarUsuario, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}
