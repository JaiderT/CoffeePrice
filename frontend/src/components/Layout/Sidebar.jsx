import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import { useAlertasContext } from '../../context/AlertasContext.jsx';
import { useState } from 'react';

const menuProductor = [
  { icon: 'fa-solid fa-gauge', label: 'Dashboard', path: '/dashboard' },
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
  { icon: 'fa-solid fa-gauge', label: 'Dashboard', path: '/admin/dashboard' },
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
    usuario?.rol === 'admin'
      ? menuAdmin
      : usuario?.rol === 'comprador'
        ? menuComprador
        : menuProductor;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 flex h-18 items-center gap-2 overflow-x-auto border-t border-white/10 bg-[#2C1A0E]/98 px-3 py-2 backdrop-blur md:inset-x-auto md:bottom-auto md:left-0 md:top-0 md:h-screen md:w-16 md:flex-col md:justify-start md:gap-2 md:overflow-visible md:border-r md:border-t-0 md:px-0 md:py-4">
        <div className="hidden md:mb-4 md:flex md:h-10 md:w-10 md:items-center md:justify-center md:rounded-xl md:bg-[#C8A96E] md:text-xl">
          ☕
        </div>

        {menuItems.map((item, i) => (
          <Link
            key={i}
            to={item.path}
            className={`group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200 md:h-10 md:w-10 ${
              location.pathname === item.path
                ? 'bg-[#C8A96E] text-white'
                : 'text-gray-400 hover:bg-[#3D1F0F] hover:text-white'
            }`}
          >
            <i className={`${item.icon} text-sm`} />

            {item.esAlertas && alertasDisparadas.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {alertasDisparadas.length}
              </span>
            )}

            <span className="pointer-events-none absolute bottom-14 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-gray-700 bg-[#2C1A0E] px-3 py-1.5 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:bottom-auto md:left-14 md:translate-x-0">
              {item.label}
              {item.esAlertas && alertasDisparadas.length > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] text-white">
                  {alertasDisparadas.length}
                </span>
              )}
            </span>
          </Link>
        ))}

        {usuario && (
          <button
            onClick={() => setMostrarModal(true)}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-all duration-200 hover:bg-red-900 hover:text-red-300 md:hidden"
          >
            <i className="fa-solid fa-right-from-bracket text-sm" />
          </button>
        )}

        {usuario && (
          <div className="hidden md:mt-auto md:flex md:flex-col md:items-center md:gap-2">
            <div className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#C8A96E] text-sm font-bold text-white transition-colors hover:bg-[#B8994E]">
              {iniciales}
              <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-lg border border-gray-700 bg-[#2C1A0E] px-3 py-1.5 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {usuario?.nombre} {usuario?.apellido}
              </span>
            </div>
            <button
              onClick={() => setMostrarModal(true)}
              className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-all duration-200 hover:bg-red-900 hover:text-red-300"
            >
              <i className="fa-solid fa-right-from-bracket text-sm" />
              <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-lg border border-gray-700 bg-[#2C1A0E] px-3 py-1.5 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Cerrar sesión
              </span>
            </button>
          </div>
        )}
      </div>

      {usuario && mostrarModal && (
        <div
          className="fixed inset-0 z-2000 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}
        >
          <div className="w-full max-w-80 rounded-2xl bg-white p-6 text-center shadow-xl md:p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF8E7]">
              <i className="fa-solid fa-right-from-bracket text-2xl text-[#C8A96E]" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-[#2C1A0E]">¿Cerrar sesión?</h3>
            <p className="mb-6 text-sm text-gray-400">
              ¿Estás seguro de que deseas cerrar tu sesión en CoffePrice?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarModal(false)}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 rounded-xl bg-[#2C1A0E] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3D1F0F]"
              >
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
