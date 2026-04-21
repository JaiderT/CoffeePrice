import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthProvider.jsx';
import { AlertasProvider } from './context/AlertasContext.jsx';
import axios from "axios";

axios.defaults.withCredentials = true;

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rol');
      localStorage.removeItem('name');
      localStorage.removeItem('apellido');
      localStorage.removeItem('usuarioId');
      localStorage.removeItem('celular');
      localStorage.removeItem('email');
      window.location.href = "/login?error=sesion_expirada";
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AlertasProvider>
        <App />
      </AlertasProvider>
    </AuthProvider>
  </StrictMode>,
)
