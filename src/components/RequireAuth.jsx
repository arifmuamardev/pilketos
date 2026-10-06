import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAuth({ children, roles }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="center-screen">Memuat sesi...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/login" replace />
  if (roles && !roles.includes(profile.role)) return <Navigate to="/" replace />

  return children
}
