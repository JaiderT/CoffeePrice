import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from "./components/Auth/Login.jsx"
import Navbar from "./components/Layout/Navbar.jsx"
import Inicio from "./components/Home/Inicio.jsx"

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path='/' element={<Inicio />} />
        <Route path='/login' element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
