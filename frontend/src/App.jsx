import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth.js';

const Login = lazy(() => import('./components/Auth/Login.jsx'));
const Register = lazy(() => import('./components/Auth/Register.jsx'));
const GoogleAuth = lazy(() => import('./components/Auth/GoogleAuth.jsx'));
const CompletarPerfil = lazy(() => import('./components/Auth/CompletarPerfil.jsx'));
const ForgotPassword = lazy(() => import('./components/Auth/ForgotPassword.jsx'));
const VerifyCode = lazy(() => import('./components/Auth/VerifyCode.jsx'));
const VerifyEmail = lazy(() => import('./components/Auth/Verifyemail.jsx'));

const Inicio = lazy(() => import('./components/Home/Inicio.jsx'));
const Noticias = lazy(() => import('./components/Home/Noticias.jsx'));
const NoticiaDetalle = lazy(() => import('./components/Home/NoticiaDetalle.jsx'));
const Contacto = lazy(() => import('./components/Home/Contacto.jsx'));
const Precios = lazy(() => import('./components/Home/Precios.jsx'));
const Predicciones = lazy(() => import('./components/Home/Predicciones.jsx'));
const PerfilProductor = lazy(() => import('./components/Home/Perfilproductor.jsx'));
const Alertas = lazy(() => import('./components/Home/Alertas.jsx'));
const Historial = lazy(() => import('./components/Home/Historial.jsx'));
const DashboardProductor = lazy(() => import('./components/Home/DashboardCaficultor.jsx'));
const DashboardComprador = lazy(() => import('./components/Home/DashboardComprador.jsx'));
const PerfilComprador = lazy(() => import('./components/Home/Perfilcomprador.jsx'));
const MapaCompradores = lazy(() => import('./components/Home/MapaCompradores.jsx'));
const PerfilAdmin = lazy(() => import('./components/Home/Perfiladmin.jsx'));
const Configuracion = lazy(() => import('./components/Home/Configuracion.jsx'));
const DashboardAdmin = lazy(() => import('./components/Home/DashboardAdmin.jsx'));
const PerfilPublicoComprador = lazy(() => import('./components/Home/PerfilPublicoComprador.jsx'));
const CuentaSuspendida = lazy(() => import('./components/Home/CuentaSuspendida.jsx'));

import LayoutPrivado from './components/Layout/LayoutPrivado.jsx';
import LayoutComprador from './components/Layout/LayoutComprador.jsx';
import LayoutPublico from './components/Layout/LayoutPublico.jsx';
import PrivateRoute from './components/Layout/PrivateRoute.jsx';
import NotFound from './components/NotFound.jsx';
import Kaffi from './components/kaffi.jsx';

function ScreenLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="rounded-2xl border border-[#E7D9BF] bg-white px-5 py-4 text-sm font-semibold text-[#6B5A4D] shadow-sm">
        Cargando pantalla...
      </div>
    </div>
  );
}

function App() {
  const { usuario } = useAuth();

  const suspendido = usuario?.estado === 'suspendido';
  const compradorPendiente = usuario?.rol === 'comprador' && usuario?.estado !== 'activo';

  return (
    <BrowserRouter>
      <>
        <Suspense fallback={<ScreenLoader />}>
          <Routes>
            <Route
              path="/cuenta-suspendida"
              element={usuario ? <CuentaSuspendida /> : <Navigate to="/login" />}
            />

            <Route
              path="/"
              element={
                suspendido ? (
                  <Navigate to="/cuenta-suspendida" />
                ) : compradorPendiente ? (
                  <Navigate to="/completar-perfil" replace />
                ) : usuario?.rol ? (
                  <LayoutPrivado>
                    <Inicio />
                  </LayoutPrivado>
                ) : (
                  <LayoutPublico>
                    <Inicio />
                  </LayoutPublico>
                )
              }
            />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/google" element={<GoogleAuth />} />
            <Route
              path="/completar-perfil"
              element={
                suspendido ? <Navigate to="/cuenta-suspendida" /> : <CompletarPerfil />
              }
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-code" element={<VerifyCode />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route
              path="/contacto"
              element={suspendido ? <Navigate to="/cuenta-suspendida" /> : <Contacto />}
            />
            <Route
              path="/noticias"
              element={suspendido ? <Navigate to="/cuenta-suspendida" /> : <Noticias />}
            />
            <Route
              path="/noticias/:id"
              element={suspendido ? <Navigate to="/cuenta-suspendida" /> : <NoticiaDetalle />}
            />

            <Route
              path="/precios"
              element={
                suspendido ? (
                  <Navigate to="/cuenta-suspendida" />
                ) : compradorPendiente ? (
                  <Navigate to="/completar-perfil" replace />
                ) : (
                  <LayoutPrivado>
                    <Precios />
                  </LayoutPrivado>
                )
              }
            />
            <Route
              path="/predicciones"
              element={
                suspendido ? (
                  <Navigate to="/cuenta-suspendida" />
                ) : (
                  <PrivateRoute roles={['productor', 'admin']}>
                    <LayoutPrivado>
                      <Predicciones />
                    </LayoutPrivado>
                  </PrivateRoute>
                )
              }
            />
            <Route
              path="/perfil"
              element={
                suspendido ? (
                  <Navigate to="/cuenta-suspendida" />
                ) : (
                  <PrivateRoute roles={['productor']}>
                    <LayoutPrivado>
                      <PerfilProductor />
                    </LayoutPrivado>
                  </PrivateRoute>
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                suspendido ? (
                  <Navigate to="/cuenta-suspendida" />
                ) : (
                  <PrivateRoute roles={['productor']}>
                    <LayoutPrivado>
                      <DashboardProductor />
                    </LayoutPrivado>
                  </PrivateRoute>
                )
              }
            />
            <Route
              path="/alertas"
              element={
                suspendido ? (
                  <Navigate to="/cuenta-suspendida" />
                ) : (
                  <PrivateRoute roles={['productor']}>
                    <LayoutPrivado>
                      <Alertas />
                    </LayoutPrivado>
                  </PrivateRoute>
                )
              }
            />
            <Route
              path="/historial"
              element={
                suspendido ? (
                  <Navigate to="/cuenta-suspendida" />
                ) : (
                  <PrivateRoute roles={['productor', 'admin']}>
                    <LayoutPrivado>
                      <Historial />
                    </LayoutPrivado>
                  </PrivateRoute>
                )
              }
            />

            <Route
              path="/comprador/dashboard"
              element={
                suspendido ? (
                  <Navigate to="/cuenta-suspendida" />
                ) : (
                  <PrivateRoute roles={['comprador']}>
                    {compradorPendiente ? (
                      <Navigate to="/completar-perfil" replace />
                    ) : (
                      <LayoutComprador>
                        <DashboardComprador />
                      </LayoutComprador>
                    )}
                  </PrivateRoute>
                )
              }
            />
            <Route
              path="/comprador/perfil"
              element={
                suspendido ? (
                  <Navigate to="/cuenta-suspendida" />
                ) : (
                  <PrivateRoute roles={['comprador']}>
                    {compradorPendiente ? (
                      <Navigate to="/completar-perfil" replace />
                    ) : (
                      <LayoutComprador>
                        <PerfilComprador />
                      </LayoutComprador>
                    )}
                  </PrivateRoute>
                )
              }
            />
            <Route
              path="/mapa"
              element={
                suspendido ? (
                  <Navigate to="/cuenta-suspendida" />
                ) : (
                  <PrivateRoute roles={['comprador', 'productor', 'admin']}>
                    {compradorPendiente ? (
                      <Navigate to="/completar-perfil" replace />
                    ) : (
                      <LayoutComprador>
                        <MapaCompradores />
                      </LayoutComprador>
                    )}
                  </PrivateRoute>
                )
              }
            />

            <Route
              path="/comprador/:id"
              element={suspendido ? <Navigate to="/cuenta-suspendida" /> : <PerfilPublicoComprador />}
            />

            <Route
              path="/admin/perfil"
              element={
                suspendido ? (
                  <Navigate to="/cuenta-suspendida" />
                ) : (
                  <PrivateRoute roles={['admin']}>
                    <LayoutPrivado>
                      <PerfilAdmin />
                    </LayoutPrivado>
                  </PrivateRoute>
                )
              }
            />
            <Route
              path="/configuracion"
              element={
                suspendido ? (
                  <Navigate to="/cuenta-suspendida" />
                ) : (
                  <PrivateRoute roles={['admin']}>
                    <LayoutPrivado>
                      <Configuracion />
                    </LayoutPrivado>
                  </PrivateRoute>
                )
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                suspendido ? (
                  <Navigate to="/cuenta-suspendida" />
                ) : (
                  <PrivateRoute roles={['admin']}>
                    <LayoutPrivado>
                      <DashboardAdmin />
                    </LayoutPrivado>
                  </PrivateRoute>
                )
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Kaffi />
      </>
    </BrowserRouter>
  );
}

export default App;
