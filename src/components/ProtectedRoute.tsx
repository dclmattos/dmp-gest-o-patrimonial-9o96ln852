import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Briefcase } from 'lucide-react'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()

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
  return <Outlet />
}
