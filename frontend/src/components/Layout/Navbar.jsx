import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="w-full bg-[#F5ECD7] px-8 py-4 flex items-center justify-between border-b border-[#E0D0B0]">

      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">☕</span>
        <span className="text-[#2C1A0E] text-xl font-bold">CoffePrice</span>
      </div>

      {/* Links */}
      <ul className="flex items-center gap-8">
        <li><Link to="#" className="text-[#2C1A0E] hover:text-[#6B3A2A] text-sm">¿Cómo funciona?</Link></li>
        <li><Link to="/precios" className="text-[#2C1A0E] hover:text-[#6B3A2A] text-sm">Precios</Link></li>
        <li><Link to="#" className="text-[#2C1A0E] hover:text-[#6B3A2A] text-sm">Funciones</Link></li>
        <li><Link to="#" className="text-[#2C1A0E] hover:text-[#6B3A2A] text-sm">Testimonios</Link></li>
      </ul>

      {/* Botones */}
      <div className="flex items-center gap-3">
        <Link to="/login" className="border border-[#2C1A0E] text-[#2C1A0E] px-4 py-2 rounded-full text-sm hover:bg-[#2C1A0E] hover:text-white transition-colors">
          Iniciar sesión
        </Link>
        <Link to="/registro" className="bg-[#C8A96E] text-white px-4 py-2 rounded-full text-sm hover:bg-[#B8994E] transition-colors">
          Registrarse gratis
        </Link>
      </div>

    </nav>
  );
}

export default Navbar;
