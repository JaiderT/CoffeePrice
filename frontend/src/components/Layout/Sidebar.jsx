import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { icon: '🏠', label: 'Inicio', path: '/dashboard' },
  { icon: '💰', label: 'Precios', path: '/precios' },
  { icon: '📖', label: 'Noticias', path: '/noticias' },
  { icon: '🔔', label: 'Alertas', path: '/alertas' },
  { icon: '📊', label: 'Historial', path: '/historial' },
  { icon: '⚙️', label: 'Configuración', path: '/configuracion' },
];

function Sidebar() {
  const location = useLocation();

  return (
    <div className="fixed left-0 top-0 h-screen w-16 bg-[#2C1A0E] flex flex-col items-center py-4 gap-2 z-50">

      {/* Logo */}
      <div className="w-10 h-10 bg-[#C8A96E] rounded-xl flex items-center justify-center text-xl mb-4">
        ☕
      </div>

      {/* Links */}
      {menuItems.map((item, i) => (
        <Link
          key={i}
          to={item.path}
          title={item.label}
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-200
            ${location.pathname === item.path
              ? 'bg-[#C8A96E] text-white'
              : 'text-gray-400 hover:bg-[#3D1F0F] hover:text-white'
            }`}
        >
          {item.icon}
        </Link>
      ))}

      {/* Perfil abajo */}
      <div className="mt-auto">
        <Link
          to="/perfil"
          title="Perfil"
          className="w-10 h-10 rounded-full bg-[#C8A96E] flex items-center justify-center text-white font-bold text-sm hover:bg-[#B8994E] transition-colors">
          JC
        </Link>
      </div>

    </div>
  )
}

export default Sidebar;
