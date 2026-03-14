import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import Login from "./components/Auth/Login.jsx"

function App() {
  return (
    <BrowserRouter>
    <Routes>

      <Route path='/login' element={<Login />} />

    </Routes>
    </BrowserRouter>
  )
}

export default App
