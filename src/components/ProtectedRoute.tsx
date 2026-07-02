import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Hexagon } from 'lucide-react'

export function ProtectedRoute() {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-primary">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Hexagon size={32} strokeWidth={1} />
          <p className="font-sans tracking-[0.3em] text-xs text-neutral-500 uppercase">
            Carregando
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/auth" replace />

  if (
    user?.role === 'user' &&
    location.pathname !== '/my-portfolio' &&
    location.pathname !== '/advisor' &&
    location.pathname !== '/patrimonio' &&
    location.pathname !== '/fluxo' &&
    location.pathname !== '/evolucao' &&
    location.pathname !== '/relatorios'
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
