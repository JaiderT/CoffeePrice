import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from "./components/Auth/Login.jsx"
import Inicio from "./components/Home/Inicio.jsx"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Inicio />} />
        <Route path='/login' element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
