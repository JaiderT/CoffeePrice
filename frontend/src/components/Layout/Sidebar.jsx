import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import { useAlertasContext } from '../../context/AlertasContext.jsx';
import { useState } from 'react';

const menuProductor = [
  { icon: 'fa-solid fa-house', label: 'Dashboard', path: '/dashboard' },
  { icon: 'fa-solid fa-tags', label: 'Precios', path: '/precios' },
  { icon: 'fa-solid fa-map-location-dot', label: 'Mapa', path: '/mapa' },
  { icon: 'fa-solid fa-chart-simple', label: 'Predicciones', path: '/predicciones' },
  { icon: 'fa-solid fa-newspaper', label: 'Noticias', path: '/noticias' },
  { icon: 'fa-solid fa-bell', label: 'Alertas', path: '/alertas', esAlertas: true },
  { icon: 'fa-solid fa-chart-line', label: 'Historial', path: '/historial' },
  { icon: 'fa-solid fa-envelope', label: 'Contacto', path: '/contacto' },
  { icon: 'fa-solid fa-user', label: 'Mi perfil', path: '/perfil' },
];

const menuAdmin = [
  { icon: 'fa-solid fa-house', label: 'Inicio', path: '/' },
  { icon: 'fa-solid fa-tags', label: 'Precios', path: '/precios' },
  { icon: 'fa-solid fa-chart-simple', label: 'Predicciones', path: '/predicciones' },
  { icon: 'fa-solid fa-newspaper', label: 'Noticias', path: '/noticias' },
  { icon: 'fa-solid fa-user-shield', label: 'Panel Admin', path: '/admin/perfil' },
  { icon: 'fa-solid fa-gear', label: 'Configuración', path: '/configuracion' },
];

const menuComprador = [
  { icon: 'fa-solid fa-gauge', label: 'Dashboard', path: '/comprador/dashboard' },
  { icon: 'fa-solid fa-tags', label: 'Precios', path: '/precios' },
  { icon: 'fa-solid fa-map-location-dot', label: 'Mapa', path: '/mapa' },
  { icon: 'fa-solid fa-newspaper', label: 'Noticias', path: '/noticias' },
  { icon: 'fa-solid fa-building', label: 'Mi empresa', path: '/comprador/perfil' },
  { icon: 'fa-solid fa-envelope', label: 'Contacto', path: '/contacto' },
];

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const { alertasDisparadas } = useAlertasContext();
  const [mostrarModal, setMostrarModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMostrarModal(false);
  };

  const iniciales = usuario
    ? `${usuario.nombre?.[0] || ''}${usuario.apellido?.[0] || ''}`.toUpperCase()
    : '?';

  const menuItems =
    usuario?.rol === 'admin' ? menuAdmin :
    usuario?.rol === 'comprador' ? menuComprador :
    menuProductor;

  return (
    <>
      <div className="fixed left-0 top-0 h-screen w-16 bg-[#2C1A0E] flex flex-col items-center py-4 gap-2 z-50">

        {/* Logo */}
        <div className="w-10 h-10 bg-[#C8A96E] rounded-xl flex items-center justify-center text-xl mb-4">
          ☕
        </div>

        {/* Links */}
        {menuItems.map((item, i) => (
          <Link key={i} to={item.path}
            className={`relative group w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
              location.pathname === item.path
                ? 'bg-[#C8A96E] text-white'
                : 'text-gray-400 hover:bg-[#3D1F0F] hover:text-white'
            }`}>
            <i className={`${item.icon} text-sm`}></i>

            {/* Contador alertas */}
            {item.esAlertas && alertasDisparadas.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {alertasDisparadas.length}
              </span>
            )}

            <span className="absolute left-14 bg-[#2C1A0E] text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-gray-700">
              {item.label}
              {item.esAlertas && alertasDisparadas.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {alertasDisparadas.length}
                </span>
              )}
            </span>
          </Link>
        ))}

        {/* Perfil y logout abajo */}
        {usuario && (
          <div className="mt-auto flex flex-col items-center gap-2">
            <div className="relative group w-10 h-10 rounded-full bg-[#C8A96E] flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-[#B8994E] transition-colors">
              {iniciales}
              <span className="absolute left-14 bg-[#2C1A0E] text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-gray-700">
                {usuario?.nombre} {usuario?.apellido}
              </span>
            </div>
            <button onClick={() => setMostrarModal(true)}
              className="relative group w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-900 hover:text-red-300 transition-all duration-200">
              <i className="fa-solid fa-right-from-bracket text-sm"></i>
              <span className="absolute left-14 bg-[#2C1A0E] text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-gray-700">
                Cerrar sesión
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Modal cerrar sesión */}
      {usuario && mostrarModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-80 shadow-xl text-center">
            <div className="w-16 h-16 bg-[#FFF8E7] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-right-from-bracket text-[#C8A96E] text-2xl"></i>
            </div>
            <h3 className="text-[#2C1A0E] font-bold text-lg mb-2">¿Cerrar sesión?</h3>
            <p className="text-gray-400 text-sm mb-6">¿Estás seguro que deseas cerrar tu sesión en CoffePrice?</p>
            <div className="flex gap-3">
              <button onClick={() => setMostrarModal(false)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleLogout}
                className="flex-1 bg-[#2C1A0E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors">
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
