import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAlertas } from './hooks/useAlertas.js';

// Auth
import Login from "./components/Auth/Login.jsx";
import Register from "./components/Auth/Register.jsx";
import GoogleAuth from "./components/Auth/GoogleAuth.jsx";
import CompletarPerfil from "./components/Auth/CompletarPerfil.jsx";
import ForgotPassword from "./components/Auth/ForgotPassword.jsx";
import VerifyCode from "./components/Auth/VerifyCode.jsx";
import VerifyEmail from './components/Auth/Verifyemail.jsx';

// Páginas públicas
import Inicio from "./components/Home/Inicio.jsx";
import Noticias from "./components/Home/Noticias.jsx";
import Contacto from './components/Home/Contacto.jsx';

// Páginas privadas — Productor
import Precios from "./components/Home/Precios.jsx";
import Predicciones from "./components/Home/Predicciones.jsx";
import PerfilProductor from "./components/Home/Perfilproductor.jsx";
import Alertas from "./components/Home/Alertas.jsx";
import Historial from "./components/Home/Historial.jsx";
import DashboardProductor from './components/Home/DashboardCaficultor.jsx';

// Páginas privadas — Comprador
import DashboardComprador from "./components/Home/DashboardComprador.jsx";
import PerfilComprador from "./components/Home/Perfilcomprador.jsx";
import MapaCompradores from './components/Home/MapaCompradores.jsx';

// Páginas privadas — Admin
import PerfilAdmin from "./components/Home/Perfiladmin.jsx";
import Configuracion from "./components/Home/Configuracion.jsx";

// Perfil público
import PerfilPublicoComprador from "./components/Home/PerfilPublicoComprador.jsx";

// Layouts y protección de rutas
import LayoutPrivado from "./components/Layout/LayoutPrivado.jsx";
import LayoutComprador from "./components/Layout/LayoutComprador.jsx";
import LayoutPublico from "./components/Layout/LayoutPublico.jsx";
import PrivateRoute from "./components/Layout/PrivateRoute.jsx";
import NotFound from './components/NotFound.jsx';
import Kaffi from './components/kaffi.jsx';

function App() {
  useAlertas();

  return (
    <BrowserRouter>
      <>
        <Routes>

        {/* ── PÚBLICAS ── */}
        <Route path="/" element={
          <LayoutPublico>
            <Inicio />
          </LayoutPublico>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/google" element={<GoogleAuth />} />
        <Route path="/completar-perfil" element={<CompletarPerfil />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/noticias" element={<Noticias />} />

        {/* ── PRODUCTOR ── */}
        <Route path="/precios" element={
          <LayoutPrivado><Precios /></LayoutPrivado>
        } />
        <Route path="/predicciones" element={
          <PrivateRoute roles={['productor', 'admin']}>
            <LayoutPrivado><Predicciones /></LayoutPrivado>
          </PrivateRoute>
        } />
        <Route path="/perfil" element={
          <PrivateRoute roles={['productor']}>
            <LayoutPrivado><PerfilProductor /></LayoutPrivado>
          </PrivateRoute>
        } />
        <Route path="/dashboard" element={
          <PrivateRoute roles={['productor']}>
            <LayoutPrivado><DashboardProductor /></LayoutPrivado>
          </PrivateRoute>
        } />
        <Route path="/alertas" element={
          <PrivateRoute roles={['productor']}>
            <LayoutPrivado><Alertas /></LayoutPrivado>
          </PrivateRoute>
        } />
        <Route path="/historial" element={
          <PrivateRoute roles={['productor', 'admin']}>
            <LayoutPrivado><Historial /></LayoutPrivado>
          </PrivateRoute>
        } />

        {/* ── COMPRADOR ── */}
        <Route path="/comprador/dashboard" element={
          <PrivateRoute roles={['comprador']}>
            <LayoutComprador><DashboardComprador /></LayoutComprador>
          </PrivateRoute>
        } />
        <Route path="/comprador/perfil" element={
          <PrivateRoute roles={['comprador']}>
            <LayoutComprador><PerfilComprador /></LayoutComprador>
          </PrivateRoute>
        } />
        <Route path="/mapa" element={
            <LayoutComprador><MapaCompradores /></LayoutComprador>
        } />

        {/* ── PERFIL PÚBLICO ── debe ir después de /comprador/dashboard y /comprador/perfil ── */}
        <Route path="/comprador/:id" element={<PerfilPublicoComprador />} />

        {/* ── ADMIN ── */}
        <Route path="/admin/perfil" element={
          <PrivateRoute roles={['admin']}>
            <LayoutPrivado><PerfilAdmin /></LayoutPrivado>
          </PrivateRoute>
        } />
        <Route path="/configuracion" element={
          <PrivateRoute roles={['admin']}>
            <LayoutPrivado><Configuracion /></LayoutPrivado>
          </PrivateRoute>
        } />

        <Route path="*" element={<NotFound />} />

        </Routes>
        <Kaffi />
      </>
    </BrowserRouter>
  );
}

export default App;
