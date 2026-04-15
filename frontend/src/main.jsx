import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContex.jsx'
import { AlertasProvider } from './context/AlertasContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AlertasProvider>
        <App />
      </AlertasProvider>
    </AuthProvider>
  </StrictMode>,
)
