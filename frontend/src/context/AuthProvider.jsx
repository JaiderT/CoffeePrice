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

// Lee el usuario guardado en localStorage de forma instantánea (sin fetch)
function leerUsuarioLocal() {
  const token = localStorage.getItem('token');
  const id    = localStorage.getItem('usuarioId');
  const rol   = localStorage.getItem('rol');
  if (!token || !id || !rol) return null;
  return {
    id,
    rol,
    nombre:   localStorage.getItem('name')     || '',
    apellido: localStorage.getItem('apellido') || '',
    celular:  localStorage.getItem('celular')  || '',
    email:    localStorage.getItem('email')    || '',
  };
}

export function AuthProvider({ children }) {
  // ─── Inicialización instantánea desde localStorage ───────────────
  // cargando arranca en false si ya hay datos locales, true si no los hay
  const usuarioInicial = leerUsuarioLocal();
  const [usuario, setUsuario]   = useState(usuarioInicial);
  const [cargando, setCargando] = useState(!usuarioInicial); // solo muestra loading si no hay datos locales

  useEffect(() => {
    // Verifica la sesión con el servidor EN SEGUNDO PLANO
    // Si el usuario ya está seteado desde localStorage, esto no bloquea el render
    const verificarSesion = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
        });

        if (!response.ok) {
          // Sesión expirada — limpia todo
          limpiarUsuarioLocal();
          setUsuario(null);
          return;
        }

        const data = await response.json();
        const usuarioSesion = {
          id:       data._id,
          rol:      data.rol,
          nombre:   data.nombre,
          apellido: data.apellido,
          celular:  data.celular,
          email:    data.email,
        };

        // Actualiza con datos frescos del servidor
        guardarUsuarioLocal(usuarioSesion);
        setUsuario(usuarioSesion);
      } catch {
        // Si falla la red pero hay datos locales, no cierra sesión
        // Solo limpia si no había datos locales
        if (!leerUsuarioLocal()) {
          limpiarUsuarioLocal();
          setUsuario(null);
        }
      } finally {
        setCargando(false);
      }
    };

    verificarSesion();
  }, []);

  const login = (userData) => {
    const usuarioSesion = {
      id:       userData.id || userData._id,
      rol:      userData.rol,
      nombre:   userData.nombre,
      apellido: userData.apellido,
      celular:  userData.celular,
      email:    userData.email,
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
      console.error('Error al cerrar sesión:', error);
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
