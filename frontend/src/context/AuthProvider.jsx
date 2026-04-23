import { useState } from 'react';
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
  const [usuario, setUsuario] = useState(null);
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
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error al cerrar sesion:', error);
    }

    limpiarUsuarioLocal();
    setUsuario(null);
  };

  const actualizarUsuario = (nuevosDatos) => {
    const usuarioActualizado = { ...usuario, ...nuevosDatos };
    localStorage.setItem('name', usuarioActualizado.nombre);
    localStorage.setItem('apellido', usuarioActualizado.apellido);
    if (nuevosDatos.celular) localStorage.setItem('celular', nuevosDatos.celular);
    if (nuevosDatos.email) localStorage.setItem('email', nuevosDatos.email);
    setUsuario(usuarioActualizado);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, actualizarUsuario, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

