import { useState } from 'react';
import { AuthContext } from './AuthContext.js';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    const nombre = localStorage.getItem('name');
    const apellido = localStorage.getItem('apellido');
    const id = localStorage.getItem('usuarioId');
    const celular = localStorage.getItem('celular');
    const email = localStorage.getItem('email');

    if (token && nombre) {
      return { token, rol, nombre, apellido, id, celular, email };
    }

    return null;
  });

  const cargando = false;

  const login = (token, rol, nombre, apellido, id, celular, email) => {
    localStorage.setItem('token', token);
    localStorage.setItem('rol', rol);
    localStorage.setItem('name', nombre);
    localStorage.setItem('apellido', apellido);
    localStorage.setItem('usuarioId', id);
    localStorage.setItem('celular', celular || '');
    localStorage.setItem('email', email || '');
    setUsuario({ token, rol, nombre, apellido, id, celular, email });
  };

  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('name');
    localStorage.removeItem('apellido');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('celular');
    localStorage.removeItem('email');
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