import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AlertasContext = createContext();

export function AlertasProvider({ children }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const [alertasDisparadas, setAlertasDisparadas] = useState([]);
  const [mostrarBanner, setMostrarBanner] = useState(false);

  const verificarAlertas = useCallback(async () => {
    const token = localStorage.getItem('token');
    const usuarioId = localStorage.getItem('usuarioId');
    if (!token || !usuarioId) return;
    try {
      const { data } = await axios.get(
        `${API_URL}/api/alertas/verificar/${usuarioId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.length > 0) {
        setAlertasDisparadas(data);
        setMostrarBanner(true);
        if ('Notification' in window && Notification.permission === 'granted') {
          data.forEach(alerta => {
            new Notification('🔔 ¡Alerta de precio CoffePrice!', {
              body: `${alerta.comprador?.nombreempresa || 'Un comprador'} superó $${Number(alerta.precioMinimo).toLocaleString()}`,
              icon: '/favicon.ico',
            });
          });
        }
      }
    } catch { /* silencioso */ }
  }, [API_URL]);

  const confirmarAlerta = async (alerta) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/api/alertas/${alerta._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch { /* silencioso */ }
    const nuevas = alertasDisparadas.filter(a => a._id !== alerta._id);
    setAlertasDisparadas(nuevas);
    if (nuevas.length === 0) setMostrarBanner(false);
  };

  const cerrarBanner = () => {
    setMostrarBanner(false);
    setAlertasDisparadas([]);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioId = localStorage.getItem('usuarioId');
    if (!token || !usuarioId) return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    verificarAlertas();
    const intervalo = setInterval(verificarAlertas, 30000);
    return () => clearInterval(intervalo);
  }, [verificarAlertas]);

  return (
    <AlertasContext.Provider value={{ alertasDisparadas, mostrarBanner, cerrarBanner }}>
      {children}

      {mostrarBanner && alertasDisparadas.length > 0 && (
        <div className="fixed top-4 right-4 z-100 max-w-sm w-full space-y-2">
          {alertasDisparadas.map((alerta, i) => {
            const urlDestino = alerta.comprador?._id
              ? `/comprador/${alerta.comprador._id}`
              : `/precios`;
            const textoBoton = alerta.comprador?._id
              ? '👁 Ver comprador'
              : '📊 Ver precios';

            return (
              <div key={i} className="bg-white rounded-2xl shadow-xl border border-[#C8A96E] p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8E7] rounded-xl flex items-center justify-center shrink-0 text-xl">
                    🔔
                  </div>
                  <div className="flex-1">
                    <p className="text-[#2C1A0E] font-bold text-sm">¡Alerta de precio cumplida!</p>
                    <p className="text-[#8B7355] text-xs mt-0.5">
                      <span className="font-semibold text-[#C8A96E]">
                        {alerta.comprador?.nombreempresa || 'Un comprador'}
                      </span>{' '}
                      superó el precio mínimo de{' '}
                      <span className="font-bold text-[#2C1A0E]">
                        ${Number(alerta.precioMinimo).toLocaleString()}
                      </span>
                    </p>
                    <div className="flex gap-2 mt-3">
                      <a href={urlDestino}
                        onClick={() => confirmarAlerta(alerta)}
                        className="flex-1 text-center bg-[#2C1A0E] text-white text-xs font-semibold py-2 rounded-xl hover:bg-[#3D1F0F] transition-colors">
                        {textoBoton}
                      </a>
                      <button onClick={() => confirmarAlerta(alerta)}
                        className="flex-1 border border-gray-200 text-gray-500 text-xs font-semibold py-2 rounded-xl hover:bg-gray-50 transition-colors">
                        ✓ Entendido
                      </button>
                    </div>
                  </div>
                  <button onClick={() => {
                    const nuevas = alertasDisparadas.filter((_, j) => j !== i);
                    setAlertasDisparadas(nuevas);
                    if (nuevas.length === 0) setMostrarBanner(false);
                  }} className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0">
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AlertasContext.Provider>
  );
}

export function useAlertasContext() {
  return useContext(AlertasContext);
}
