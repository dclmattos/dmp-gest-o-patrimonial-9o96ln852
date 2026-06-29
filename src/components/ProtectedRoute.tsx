import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Briefcase } from 'lucide-react'

export function ProtectedRoute() {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-primary">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Briefcase size={32} />
          <p className="font-serif tracking-widest text-sm text-slate-400">CARREGANDO COFRE</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/auth" replace />

  if (
    user?.role === 'user' &&
    location.pathname !== '/my-portfolio' &&
    location.pathname !== '/advisor'
  ) {
    return <Navigate to="/my-portfolio" replace />
  }

  if (user?.role === 'user' && location.pathname === '/users') {
    return <Navigate to="/my-portfolio" replace />
  }

  if (user?.role === 'admin' && location.pathname === '/my-portfolio') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
