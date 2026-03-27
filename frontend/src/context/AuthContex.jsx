import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    const nombre = localStorage.getItem('name');
    const apellido = localStorage.getItem('apellido');
    const id = localStorage.getItem('usuarioId');
    if (token && nombre) {
      setUsuario({ token, rol, nombre, apellido, id});
    }
    setCargando(false);
  }, []);

  const login = (token, rol, nombre, apellido, id) => {
    localStorage.setItem('token', token);
    localStorage.setItem('rol', rol);
    localStorage.setItem('name', nombre);
    localStorage.setItem('apellido', apellido);
    localStorage.setItem('usuarioId', id);
    setUsuario({ token, rol, nombre, apellido, id });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('name');
    localStorage.removeItem('apellido');
    localStorage.removeItem('usuarioId');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
