import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContex.jsx'

export default function GoogleAuth() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const token = params.get('token')
    const error = params.get('error')

    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))

      login(
        token,
        payload.rol,
        payload.name,
        payload.apellido,
        payload.id,
        '',
        ''
      )

      if (payload.rol === 'admin') {
        navigate('/admin/perfil', { replace: true })
      } else if (payload.rol === 'comprador') {
        navigate('/comprador/dashboard', { replace: true })
      } else {
        navigate('/precios', { replace: true })
      }
    } else {
      navigate('/login?error=' + (error || 'google_failed'), { replace: true })
    }
  }, [login, navigate, params])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
      <div className="text-center">
        <div className="text-5xl mb-4">☕</div>
        <p className="text-[#3B1F0A] font-semibold">Autenticando con Google...</p>
      </div>
    </div>
  )
}
