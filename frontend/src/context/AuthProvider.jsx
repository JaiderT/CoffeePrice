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
  localStorage.setItem('estado', usuario.estado || '');
}

function limpiarUsuarioLocal() {
  ['token','rol','name','apellido','usuarioId','celular','email','estado']
    .forEach(k => localStorage.removeItem(k));
}

function leerUsuarioLocal() {
  const rol = localStorage.getItem('rol');
  const id = localStorage.getItem('usuarioId');
  if (!rol || !id) return null;
  return {
    id,
    rol,
    nombre: localStorage.getItem('name') || '',
    apellido: localStorage.getItem('apellido') || '',
    celular: localStorage.getItem('celular') || '',
    email: localStorage.getItem('email') || '',
    estado: localStorage.getItem('estado') || 'activo',
  };
}

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