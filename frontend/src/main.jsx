import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthProvider.jsx';
import { AlertasProvider } from './context/AlertasContext.jsx'
import axios from "axios";
import { limpiarUsuarioLocal } from './utils/authStorage.js';

const RUTAS_PUBLICAS = [
  "/api/precios",
  "/api/noticias",
  "/api/predicciones",
  "/api/comprador",
  "/api/clima",
  "/api/precio-fnc",
  "/api/resenas",
];
 
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      const esPublica = RUTAS_PUBLICAS.some(ruta => url.includes(ruta));
      if (!esPublica) {
        // Solo redirige si la ruta requería autenticación
        limpiarUsuarioLocal();
        window.location.href = "/login?error=sesion_expirada";
      }
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
