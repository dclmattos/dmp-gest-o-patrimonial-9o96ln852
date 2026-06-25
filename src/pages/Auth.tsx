import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-950 text-slate-50 relative overflow-hidden">
      {/* Main Background Image */}
      <img
        src="https://img.usecurling.com/p/1920/1080?q=abstract%20minimalist%20architecture&color=black&dpr=2"
        alt="Strategic Wealth Management"
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 transition-transform duration-1000"
      />
      {/* Gradient Overlays for Form Legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/15 via-slate-950/50 to-slate-950/90 z-0" />

      {/* Brand Watermark / Stamp */}
      <div className="z-10 w-full max-w-md mb-8 sm:absolute sm:top-12 sm:left-12 sm:mb-0 sm:w-auto flex justify-center sm:justify-start pointer-events-none mix-blend-overlay opacity-80 animate-fade-in">
        <div className="border border-white/20 p-5 sm:p-6 rounded-sm relative">
          {/* Subtle corner accents */}
          <div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-white/70" />
          <div className="absolute -top-px -right-px w-2 h-2 border-t border-r border-white/70" />
          <div className="absolute -bottom-px -left-px w-2 h-2 border-b border-l border-white/70" />
          <div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-white/70" />

          <h1 className="flex flex-col text-center sm:text-left font-exclusive text-white antialiased">
            <span className="text-4xl sm:text-5xl font-bold tracking-[0.25em] leading-none mb-1">
              DMP
            </span>
            <span className="text-lg sm:text-xl font-medium italic opacity-90 tracking-[0.15em]">
              Gestão Patrimonial
            </span>
          </h1>
        </div>
      </div>

      <div className="z-10 w-full max-w-md p-8 sm:p-10 space-y-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl shadow-2xl animate-fade-in-up">
        {/* Form specific header since brand moved to watermark */}
        <div className="text-center space-y-2 pb-2">
          <h2 className="text-xl font-serif text-white tracking-wide">Acesso Restrito</h2>
          <p className="text-[0.65rem] sm:text-xs font-light text-slate-400 tracking-[0.2em] uppercase">
            Cofre de Inteligência Estratégica
          </p>
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
