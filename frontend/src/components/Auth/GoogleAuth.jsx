import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';

export default function GoogleAuth() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const errorParam = params.get("error");
    if (errorParam) {
      navigate(`/login?error=${errorParam}`, { replace: true });
      return;
    }

    const verificarSesion = async () => {
      try {
        const meResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!meResponse.ok) {
          throw new Error('No hay sesión activa');
        }

        const userData = await meResponse.json();

        login({
          id: userData._id,
          rol: userData.rol,
          nombre: userData.nombre,
          apellido: userData.apellido,
          celular: userData.celular,
          email: userData.email,
        });

        if (userData.rol === "admin") {
          navigate("/admin/perfil", { replace: true });
        } else if (userData.rol === "comprador") {
          navigate("/comprador/dashboard", { replace: true });
        } else {
          navigate("/precios", { replace: true });
        }
      } catch (err) {
        console.error("Error verificando sesión:", err);
        navigate("/login?error=google_auth_failed", { replace: true });
      }
    };

    verificarSesion();
  }, [params, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">☕</div>
        <p className="text-[#3B1F0A] font-semibold">Verificando autenticación con Google...</p>
        <p className="text-xs text-gray-400 mt-2">Esto puede tomar unos segundos</p>
      </div>
    </div>
  );
}
