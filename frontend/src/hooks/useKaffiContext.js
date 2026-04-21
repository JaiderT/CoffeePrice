import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useKaffiContext = (setMensajes) => {
  const location = useLocation();
  
  useEffect(() => {
    // Tips contextuales según la ruta actual
    const tipsPorPagina = {
      '/': {
        mensaje: "🎯 ¡Bienvenido a CoffePrice! Primero regístrate para ver precios actualizados. ¿Necesitas ayuda con el registro?",
        tiempo: 3000
      },
      '/precios': {
        mensaje: "📊 Aquí están los precios del pergamino seco. ¿Sabías que los martes suelen haber mejores ofertas?",
        tiempo: 2000
      },
      '/mapa': {
        mensaje: "🤝 Buscando compradores en El Pital? Te ayudo a comparar precios y condiciones de pago.",
        tiempo: 2000
      },
      '/register': {
        mensaje: "📝 Para registrarte solo necesitas nombre, teléfono y tu vereda. ¿En qué te ayudo?",
        tiempo: 2500
      },
      '/comprador/dashboard': {
        mensaje: "📊 Aquí puedes ver tus estadísticas de venta. ¿Quieres consejos para mejorar tus precios?",
        tiempo: 2000
      },
      '/alertas': {
        mensaje: "🔔 Te avisaré cuando los precios suban. ¿Qué precio mínimo te interesa?",
        tiempo: 2000
      }
    };
    
    const tip = tipsPorPagina[location.pathname];
    if (tip) {
      const tipVisto = sessionStorage.getItem(`tip_${location.pathname}`);
      if (!tipVisto) {
        const timeout = setTimeout(() => {
          setMensajes(prev => [...prev, { 
            role: "assistant", 
            content: tip.mensaje 
          }]);
          sessionStorage.setItem(`tip_${location.pathname}`, 'visto');
        }, tip.tiempo);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [location.pathname, setMensajes]);
};
