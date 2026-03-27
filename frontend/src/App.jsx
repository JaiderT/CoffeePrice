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
import Noticias from "./components/Home/Noticias.jsx";

// Layouts
import LayoutPrivado from "./components/Layout/LayoutPrivado.jsx";
import LayoutComprador from "./components/Layout/LayoutComprador.jsx";

// Perfiles
import PerfilProductor from "./components/Home/Perfilproductor.jsx";
import PerfilComprador from "./components/Home/Perfilcomprador.jsx";
import PerfilAdmin from "./components/Home/Perfiladmin.jsx";
import PrivateRoute from './components/PrivateRoute.jsx';

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
        <Route path='/noticias' element={<Noticias />} />

        {/* ================== PRODUCTOR ================== */}
        <Route path='/precios' element={
        <PrivateRoute roles={['productor', 'admin']}>
          <LayoutPrivado><Precios /></LayoutPrivado>
        </PrivateRoute>
        } />
      
      <Route path='/perfil' element={
        <PrivateRoute roles={['productor']}>
          <LayoutPrivado><PerfilProductor /></LayoutPrivado>
        </PrivateRoute>
      } />

        {/* ================== COMPRADOR ================== */}
        <Route path='/comprador/dashboard' element={
        <PrivateRoute roles={['comprador']}>
          <LayoutComprador><DashboardComprador /></LayoutComprador>
        </PrivateRoute>
        } />
      
        <Route path='/comprador/perfil' element={
        <PrivateRoute roles={['comprador']}>
          <LayoutComprador><PerfilComprador /></LayoutComprador>
        </PrivateRoute>
        } />


        {/* ================== ADMIN ================== */}
        <Route path='/admin/perfil' element={
        <PrivateRoute roles={['admin']}>
          <LayoutPrivado><PerfilAdmin /></LayoutPrivado>
        </PrivateRoute>
        } />


      </Routes>
    </BrowserRouter>
  );
}

export default App;
