import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ForgotPassword from './components/pages/ForgotPassword.jsx';
import VerifyCode from './components/pages/VerifyCode.jsx';

// Auth
import Login from "./components/Auth/Login.jsx";
import Register from "./components/Auth/Register.jsx";
import GoogleAuth from "./components/Auth/GoogleAuth.jsx";
import CompletarPerfil from "./components/Auth/CompletarPerfil.jsx";

// Home
import Inicio from "./components/Home/Inicio.jsx";
import Precios from "./components/Home/Precios.jsx";
import DashboardComprador from "./components/Home/DashboardComprador.jsx";

// Layouts
import LayoutPrivado from "./components/Layout/LayoutPrivado.jsx";
import LayoutComprador from "./components/Layout/LayoutComprador.jsx";

// Perfiles
import PerfilProductor from "./components/Home/PerfilProductor.jsx";
import PerfilComprador from "./components/Home/PerfilComprador.jsx";
import PerfilAdmin from "./components/Home/PerfilAdmin.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================== RUTAS PÚBLICAS ================== */}
        <Route path='/' element={<Inicio />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/auth/google' element={<GoogleAuth />} />
        <Route path='/completar-perfil' element={<CompletarPerfil />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/verify-code' element={<VerifyCode />} />

        {/* ================== PRODUCTOR ================== */}
        <Route path='/precios' element={
          <LayoutPrivado>
            <Precios />
          </LayoutPrivado>
        } />

        <Route path='/perfil' element={
          <LayoutPrivado>
            <PerfilProductor />
          </LayoutPrivado>
        } />

        {/* ================== COMPRADOR ================== */}
        <Route path='/comprador/dashboard' element={
          <LayoutComprador>
            <DashboardComprador />
          </LayoutComprador>
        } />

        <Route path='/comprador/perfil' element={
          <LayoutComprador>
            <PerfilComprador />
          </LayoutComprador>
        } />

        {/* ================== ADMIN ================== */}
        <Route path='/admin/perfil' element={
          <LayoutPrivado>
            <PerfilAdmin />
          </LayoutPrivado>
        } />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
