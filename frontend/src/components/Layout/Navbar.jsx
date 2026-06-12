import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/useAuth.js';

function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const rutaPanel = usuario
    ? usuario.rol === 'admin'
      ? '/admin/perfil'
      : usuario.rol === 'comprador'
        ? '/comprador/dashboard'
        : '/perfil'
    : '/login';

  const handleLogout = async () => {
    setMenuAbierto(false);
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <nav className="w-full border-b border-[#E0D0B0] bg-[#F5ECD7] px-4 py-4 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">☕</span>
          <span className="text-xl font-bold text-[#2C1A0E]">CoffePrice</span>
        </div>

        <ul className="hidden items-center gap-8 lg:flex">
          <li><Link to="/" className="text-sm text-[#2C1A0E] hover:text-[#6B3A2A]">Inicio</Link></li>
          <li><Link to="/precios" className="text-sm text-[#2C1A0E] hover:text-[#6B3A2A]">Precios</Link></li>
          <li><Link to="/noticias" className="text-sm text-[#2C1A0E] hover:text-[#6B3A2A]">Noticias</Link></li>
          <li><Link to="/contacto" className="text-sm text-[#2C1A0E] hover:text-[#6B3A2A]">Contacto</Link></li>
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          {usuario ? (
            <>
              <Link
                to={rutaPanel}
                className="rounded-full border border-[#2C1A0E] px-4 py-2 text-sm text-[#2C1A0E] transition-colors hover:bg-[#2C1A0E] hover:text-white"
              >
                Mi panel
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full bg-[#C8A96E] px-4 py-2 text-sm text-white transition-colors hover:bg-[#B8994E]"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-[#2C1A0E] px-4 py-2 text-sm text-[#2C1A0E] transition-colors hover:bg-[#2C1A0E] hover:text-white"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-[#C8A96E] px-4 py-2 text-sm text-white transition-colors hover:bg-[#B8994E]"
              >
                Registrarse gratis
              </Link>
            </>
          )}
        </div>

        <button
          className="flex flex-col gap-1.5 p-2 lg:hidden"
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-label="Abrir menú"
        >
          <span className={`block h-0.5 w-6 bg-[#2C1A0E] transition-all duration-300 ${menuAbierto ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block h-0.5 w-6 bg-[#2C1A0E] transition-all duration-300 ${menuAbierto ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-[#2C1A0E] transition-all duration-300 ${menuAbierto ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {menuAbierto && (
        <div className="mt-4 border-t border-[#E0D0B0] pb-4 lg:hidden">
          <ul className="mt-4 flex flex-col gap-4">
            <li><Link to="/" className="block text-sm text-[#2C1A0E] hover:text-[#6B3A2A]" onClick={() => setMenuAbierto(false)}>Inicio</Link></li>
            <li><Link to="/precios" className="block text-sm text-[#2C1A0E] hover:text-[#6B3A2A]" onClick={() => setMenuAbierto(false)}>Precios</Link></li>
            <li><Link to="/noticias" className="block text-sm text-[#2C1A0E] hover:text-[#6B3A2A]" onClick={() => setMenuAbierto(false)}>Noticias</Link></li>
            <li><Link to="/contacto" className="block text-sm text-[#2C1A0E] hover:text-[#6B3A2A]" onClick={() => setMenuAbierto(false)}>Contacto</Link></li>
          </ul>

          <div className="mt-6 flex flex-col gap-3">
            {usuario ? (
              <>
                <Link
                  to={rutaPanel}
                  className="rounded-full border border-[#2C1A0E] px-4 py-2 text-center text-sm text-[#2C1A0E] transition-colors hover:bg-[#2C1A0E] hover:text-white"
                  onClick={() => setMenuAbierto(false)}
                >
                  Mi panel
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-[#C8A96E] px-4 py-2 text-center text-sm text-white transition-colors hover:bg-[#B8994E]"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full border border-[#2C1A0E] px-4 py-2 text-center text-sm text-[#2C1A0E] transition-colors hover:bg-[#2C1A0E] hover:text-white"
                  onClick={() => setMenuAbierto(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-[#C8A96E] px-4 py-2 text-center text-sm text-white transition-colors hover:bg-[#B8994E]"
                  onClick={() => setMenuAbierto(false)}
                >
                  Registrarse gratis
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
