import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import { useAlertasContext } from '../../context/AlertasContext.jsx';

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
  { icon: 'fa-solid fa-chart-line', label: 'Historial', path: '/historial' },
  { icon: 'fa-solid fa-user-shield', label: 'Panel admin', path: '/admin/perfil' },
  { icon: 'fa-solid fa-gear', label: 'Configuracion', path: '/configuracion' },
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
  const [mostrarMenuMovil, setMostrarMenuMovil] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMostrarModal(false);
    setMostrarMenuMovil(false);
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

  const accesosPrincipalesMoviles =
    usuario?.rol === 'admin'
      ? ['/admin/dashboard', '/precios', '/historial', '/admin/perfil']
      : usuario?.rol === 'comprador'
        ? ['/comprador/dashboard', '/precios', '/mapa', '/comprador/perfil']
        : ['/dashboard', '/precios', '/alertas', '/perfil'];

  const mobilePrimaryItems = menuItems.filter((item) =>
    accesosPrincipalesMoviles.includes(item.path)
  );
  const mobileSecondaryItems = menuItems.filter(
    (item) => !accesosPrincipalesMoviles.includes(item.path)
  );
  const menuSecundarioActivo = mobileSecondaryItems.some(
    (item) => item.path === location.pathname
  );

  useEffect(() => {
    setMostrarMenuMovil(false);
    setMostrarModal(false);
  }, [location.pathname]);

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#2C1A0E]/98 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto flex max-w-xl items-center gap-2 px-3 py-2">
          {mobilePrimaryItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-[#C8A96E] text-white'
                  : 'text-[#D1C6BB] hover:bg-[#3D1F0F] hover:text-white'
              }`}
            >
              <i className={`${item.icon} text-sm`} />
              <span className="truncate text-[10px] font-medium">{item.label}</span>

              {item.esAlertas && alertasDisparadas.length > 0 && (
                <span className="absolute right-3 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {alertasDisparadas.length}
                </span>
              )}
            </Link>
          ))}

          <button
            onClick={() => setMostrarMenuMovil((prev) => !prev)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-all duration-200 ${
              mostrarMenuMovil || menuSecundarioActivo
                ? 'bg-[#C8A96E] text-white'
                : 'text-[#D1C6BB] hover:bg-[#3D1F0F] hover:text-white'
            }`}
            aria-label="Abrir mas opciones"
          >
            <i className="fa-solid fa-ellipsis text-sm" />
            <span className="text-[10px] font-medium">Mas</span>
          </button>

          <button
            onClick={() => setMostrarModal(true)}
            className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[#D1C6BB] transition-all duration-200 hover:bg-red-900 hover:text-red-300"
            aria-label="Cerrar sesion"
          >
            <i className="fa-solid fa-right-from-bracket text-sm" />
            <span className="text-[10px] font-medium">Salir</span>
          </button>
        </div>
      </div>

      <div className="fixed inset-y-0 left-0 top-0 hidden w-16 flex-col border-r border-white/10 bg-[#2C1A0E]/98 py-4 backdrop-blur md:flex">
        <div className="mb-4 flex h-10 w-10 items-center justify-center self-center rounded-xl bg-[#C8A96E] text-xl">
          ☕
        </div>

        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`group relative mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
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

            <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-lg border border-gray-700 bg-[#2C1A0E] px-3 py-1.5 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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
          <div className="mt-auto flex flex-col items-center gap-2">
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
                Cerrar sesion
              </span>
            </button>
          </div>
        )}
      </div>

      {mostrarMenuMovil && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={() => setMostrarMenuMovil(false)}
            aria-label="Cerrar menu movil"
          />
          <div className="fixed inset-x-3 bottom-24 z-50 rounded-[28px] border border-[#E0D0B0] bg-[#FFF8EC] p-4 shadow-[0_24px_50px_rgba(44,26,14,0.22)] md:hidden">
            <div className="flex items-center gap-3 border-b border-[#E7D9BF] pb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#C8A96E] text-sm font-bold text-white">
                {iniciales}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#2C1A0E]">
                  {usuario?.nombre} {usuario?.apellido}
                </p>
                <p className="text-xs text-[#7B5C3E]">Accesos y herramientas</p>
              </div>
              <button
                onClick={() => setMostrarMenuMovil(false)}
                className="ml-auto rounded-full p-2 text-[#7B5C3E]"
                aria-label="Cerrar panel de opciones"
              >
                <i className="fa-solid fa-xmark text-base" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {mobileSecondaryItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition ${
                    location.pathname === item.path
                      ? 'border-[#C8A96E] bg-[#F2E4CA] text-[#2C1A0E]'
                      : 'border-[#E7D9BF] bg-white text-[#5E4B3A] hover:border-[#C8A96E]'
                  }`}
                >
                  <i className={`${item.icon} text-sm`} />
                  <span className="min-w-0 truncate font-medium">{item.label}</span>
                  {item.esAlertas && alertasDisparadas.length > 0 && (
                    <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {alertasDisparadas.length}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {usuario && mostrarModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 2000, backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}
        >
          <div className="w-full max-w-80 rounded-2xl bg-white p-6 text-center shadow-xl md:p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF8E7]">
              <i className="fa-solid fa-right-from-bracket text-2xl text-[#C8A96E]" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-[#2C1A0E]">Cerrar sesion</h3>
            <p className="mb-6 text-sm text-gray-400">
              ¿Estas seguro de que deseas cerrar tu sesion en CoffePrice?
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
                Cerrar sesion
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
