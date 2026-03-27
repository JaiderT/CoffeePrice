import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Auth
import Login from "./components/Auth/Login.jsx";
import Register from "./components/Auth/Register.jsx";
import GoogleAuth from "./components/Auth/GoogleAuth.jsx";
import CompletarPerfil from "./components/Auth/CompletarPerfil.jsx";
import ForgotPassword from "./components/Auth/ForgotPassword.jsx";
import VerifyCode from "./components/Auth/VerifyCode.jsx";

// Páginas públicas
import Inicio from "./components/Home/Inicio.jsx";
import Noticias from "./components/Home/Noticias.jsx";

// Páginas privadas — Productor
import Precios from "./components/Home/Precios.jsx";
import PerfilProductor from "./components/Home/PerfilProductor.jsx";

// Páginas privadas — Comprador
import DashboardComprador from "./components/Home/DashboardComprador.jsx";
import PerfilComprador from "./components/Home/PerfilComprador.jsx";

// Páginas privadas — Admin
import PerfilAdmin from "./components/Home/PerfilAdmin.jsx";

// Layouts y protección de rutas
import LayoutPrivado from "./components/Layout/LayoutPrivado.jsx";
import LayoutComprador from "./components/Layout/LayoutComprador.jsx";
import PrivateRoute from "./components/Layout/PrivateRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── PÚBLICAS ── */}
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/google" element={<GoogleAuth />} />
        <Route path="/completar-perfil" element={<CompletarPerfil />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/noticias" element={<Noticias />} />

        {/* ── PRODUCTOR ── */}
        <Route path="/precios" element={
          <PrivateRoute roles={['productor', 'admin']}>
            <LayoutPrivado><Precios /></LayoutPrivado>
          </PrivateRoute>
        } />
        <Route path="/perfil" element={
          <PrivateRoute roles={['productor']}>
            <LayoutPrivado><PerfilProductor /></LayoutPrivado>
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

        {/* ── ADMIN ── */}
        <Route path="/admin/perfil" element={
          <PrivateRoute roles={['admin']}>
            <LayoutPrivado><PerfilAdmin /></LayoutPrivado>
          </PrivateRoute>
        } />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
