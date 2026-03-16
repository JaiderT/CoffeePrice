import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import Login from "./components/Auth/Login.jsx"
import Prueba from "./components/Auth/Prueba.jsx"

function App() {
  return (
    <BrowserRouter>
    <Routes>

      <Route path='/login' element={<Login />} />
      <Route path='/prueba' element={<Prueba />} />

    </Routes>
    </BrowserRouter>
  )
}

export default App
