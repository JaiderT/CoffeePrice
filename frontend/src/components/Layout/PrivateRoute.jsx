import { Navigate } from 'react-router-dom';
import { useAuth } from "../../context/useAuth.js";

export default function PrivateRoute({ children, roles = [] }) {
  const { usuario, cargando } = useAuth();

  // ✅ Solo muestra loader si está cargando Y no hay usuario local todavía
  if (cargando && !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5ECD7]">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">☕</div>
          <p className="text-[#8B7355] text-sm font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}