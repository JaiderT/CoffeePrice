import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from "./components/Auth/Login.jsx"
import Inicio from "./components/Home/Inicio.jsx"
import Register from "./components/Auth/Register.jsx"
import LayoutPrivado from "./components/Layout/LayoutPrivado.jsx"
import Precios from "./components/Home/Precios.jsx"
import GoogleAuth from './components/Auth/GoogleAuth.jsx'
import CompletarPerfil from './components/Auth/CompletarPerfil.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Páginas públicas */}
        <Route path='/' element={<Inicio />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/auth/google' element={<GoogleAuth />} />
        <Route path='/completar-perfil' element={<CompletarPerfil />} />
        {/* Páginas privadas con sidebar */}
        <Route path='/precios' element={
          <LayoutPrivado>
            <Precios />
          </LayoutPrivado>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App