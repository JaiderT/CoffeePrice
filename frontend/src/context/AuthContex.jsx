import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('role');
    const nombre = localStorage.getItem('name');
    const apellido = localStorage.getItem('apellido');
    if (token && nombre) {
      setUsuario({ token, rol, nombre, apellido });
    }

    if (token && nombre) {
      setUsuario({ token, rol, nombre });
    }
    setCargando(false);
  }, []);

  const login = (token, rol, nombre, apellido, id) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', rol);
    localStorage.setItem('name', nombre);
    localStorage.setItem('apellido', apellido);
    localStorage.setItem('usuarioId', id);
    setUsuario({ token, rol, nombre, apellido, id });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
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
