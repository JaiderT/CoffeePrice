import { Link } from 'react-router-dom';
import { useState } from 'react';

function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <nav className="w-full bg-[#F5ECD7] px-4 md:px-8 py-4 border-b border-[#E0D0B0]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">☕</span>
          <span className="text-[#2C1A0E] text-xl font-bold">CoffePrice</span>
        </div>

        {/* Links - solo en pantallas grandes */}
        <ul className="hidden lg:flex items-center gap-8">
          <li><Link to="/" className="text-[#2C1A0E] hover:text-[#6B3A2A] text-sm">Inicio</Link></li>
          <li><Link to="/precios" className="text-[#2C1A0E] hover:text-[#6B3A2A] text-sm">Precios</Link></li>
          <li><Link to="#" className="text-[#2C1A0E] hover:text-[#6B3A2A] text-sm">Funciones</Link></li>
          <li><Link to="/noticias" className="text-[#2C1A0E] hover:text-[#6B3A2A] text-sm">Noticias</Link></li>
        </ul>

        {/* Botones - solo en pantallas grandes */}
        <div className="hidden lg:flex items-center gap-3">
          <Link to="/login" className="border border-[#2C1A0E] text-[#2C1A0E] px-4 py-2 rounded-full text-sm hover:bg-[#2C1A0E] hover:text-white transition-colors">
            Iniciar sesión
          </Link>
          <Link to="/register" className="bg-[#C8A96E] text-white px-4 py-2 rounded-full text-sm hover:bg-[#B8994E] transition-colors">
            Registrarse gratis
          </Link>
        </div>

        {/* Botón hamburguesa - solo en móvil */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          <span className={`block w-6 h-0.5 bg-[#2C1A0E] transition-all duration-300 ${menuAbierto ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-[#2C1A0E] transition-all duration-300 ${menuAbierto ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-[#2C1A0E] transition-all duration-300 ${menuAbierto ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>

      </div>

      {/* Menú móvil desplegable */}
      {menuAbierto && (
        <div className="lg:hidden mt-4 pb-4 border-t border-[#E0D0B0]">
          <ul className="flex flex-col gap-4 mt-4">
            <li><Link to="/" className="text-[#2C1A0E] hover:text-[#6B3A2A] text-sm block" onClick={() => setMenuAbierto(false)}>Inicio</Link></li>
            <li><Link to="/precios" className="text-[#2C1A0E] hover:text-[#6B3A2A] text-sm block" onClick={() => setMenuAbierto(false)}>Precios</Link></li>
            <li><Link to="#" className="text-[#2C1A0E] hover:text-[#6B3A2A] text-sm block" onClick={() => setMenuAbierto(false)}>Funciones</Link></li>
            <li><Link to="/noticias" className="text-[#2C1A0E] hover:text-[#6B3A2A] text-sm block" onClick={() => setMenuAbierto(false)}>Noticias</Link></li>
          </ul>
          <div className="flex flex-col gap-3 mt-6">
            <Link to="/login" className="border border-[#2C1A0E] text-[#2C1A0E] px-4 py-2 rounded-full text-sm text-center hover:bg-[#2C1A0E] hover:text-white transition-colors" onClick={() => setMenuAbierto(false)}>
              Iniciar sesión
            </Link>
            <Link to="/register" className="bg-[#C8A96E] text-white px-4 py-2 rounded-full text-sm text-center hover:bg-[#B8994E] transition-colors" onClick={() => setMenuAbierto(false)}>
              Registrarse gratis
            </Link>
          </div>
        </div>
      )}

    </nav>
  );
}

export default Navbar;
