import { Navigate } from 'react-router-dom';
import { useAuth } from "../../context/useAuth.js";

export default function PrivateRoute({ children, roles = [] }) {
    const { usuario, cargando } = useAuth();

    if (cargando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
                <p className="text-[#3B1F0A] font-semibold">Cargando........</p>
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
