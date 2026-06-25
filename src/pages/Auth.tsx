import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Briefcase } from 'lucide-react'

export default function Auth() {
  const { signIn, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('dclmattos@gmail.com')
  const [password, setPassword] = useState('Skip@Pass')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) return <Navigate to="/" replace />

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) {
      setError('Credenciais inválidas.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-slate-950 to-slate-950 z-0" />

      <div className="z-10 w-full max-w-md p-8 space-y-8 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl animate-fade-in-up">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary border border-primary/30 mb-2">
            <Briefcase size={24} />
          </div>
          <h1 className="text-3xl font-serif font-medium text-white">Gestor VIP</h1>
          <p className="text-slate-400">Inteligência Patrimonial Exclusiva</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">
              Email de Acesso
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-primary h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">
              Senha de Segurança
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-primary h-11"
            />
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full h-11 transition-all shadow-lg shadow-primary/20"
            disabled={loading}
          >
            {loading ? 'Acessando...' : 'Acessar o Cofre'}
          </Button>
        </form>
      </div>
    </div>
  )
}
