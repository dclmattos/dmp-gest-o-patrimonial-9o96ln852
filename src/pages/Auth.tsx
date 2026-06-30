import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Briefcase, Loader2, AlertCircle } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'

type Mode = 'login' | 'signup'

export default function Auth() {
  const { signIn, signUp, isAuthenticated, user } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('dclmattos@gmail.com')
  const [password, setPassword] = useState('Skip@Pass')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  if (isAuthenticated) {
    if (user?.role === 'user') return <Navigate to="/my-portfolio" replace />
    return <Navigate to="/" replace />
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (mode === 'signup' && !name.trim()) {
      errors.name = 'Nome é obrigatório.'
    }

    if (!email.trim()) {
      errors.email = 'Email é obrigatório.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email inválido.'
    }

    if (!password) {
      errors.password = 'Senha é obrigatória.'
    } else if (password.length < 8) {
      errors.password = 'A senha deve ter no mínimo 8 caracteres.'
    }

    if (mode === 'signup') {
      if (!confirmPassword) {
        errors.confirmPassword = 'Confirmação de senha é obrigatória.'
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'As senhas não coincidem.'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validate()) return

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) {
          setError(getErrorMessage(error))
        }
      } else {
        const { error } = await signUp(email, password)
        if (error) {
          setError(getErrorMessage(error))
        }
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode: Mode) => {
    setMode(newMode)
    setError(null)
    setValidationErrors({})
    if (newMode === 'login') {
      setName('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-950 text-slate-50 relative overflow-hidden">
      <img
        src="https://img.usecurling.com/p/1920/1080?q=luxury%20financial%20dark%20abstract&color=black&dpr=2"
        alt="Strategic Wealth Management"
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40 z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950 z-0" />

      {/* Brand Watermark */}
      <div className="z-10 w-full max-w-md mb-8 sm:absolute sm:top-12 sm:left-12 sm:mb-0 sm:w-auto flex justify-center sm:justify-start pointer-events-none opacity-80 animate-fade-in">
        <div className="border border-white/20 p-5 sm:p-6 rounded-sm relative">
          <div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-white/70" />
          <div className="absolute -top-px -right-px w-2 h-2 border-t border-r border-white/70" />
          <div className="absolute -bottom-px -left-px w-2 h-2 border-b border-l border-white/70" />
          <div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-white/70" />
          <h1 className="flex flex-col text-center sm:text-left font-serif text-white antialiased opacity-90">
            <span className="text-4xl sm:text-5xl font-bold tracking-[0.3em] leading-none mb-1 uppercase">
              DMP
            </span>
            <span className="text-sm sm:text-base font-medium italic opacity-90 tracking-[0.2em] uppercase mt-1">
              Gestão Patrimonial
            </span>
          </h1>
        </div>
      </div>

      <div className="z-10 w-full max-w-md animate-fade-in-up">
        <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 shadow-2xl">
          <CardHeader className="space-y-3 text-center pb-2">
            <div className="flex justify-center mb-2">
              <div className="flex items-center gap-2 text-primary">
                <Briefcase size={28} strokeWidth={1.5} />
              </div>
            </div>
            <CardTitle className="text-xl font-serif text-white tracking-wide">
              {mode === 'login' ? 'Private Wealth Manager' : 'Criar Conta'}
            </CardTitle>
            <CardDescription className="text-[0.65rem] sm:text-xs font-light text-slate-400 tracking-[0.2em] uppercase">
              {mode === 'login'
                ? 'Cofre de Inteligência Estratégica'
                : 'Acesso ao Cofre Patrimonial'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-primary h-11"
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-destructive">{validationErrors.name}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email de Acesso
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-primary h-11"
                />
                {validationErrors.email && (
                  <p className="text-sm text-destructive">{validationErrors.email}</p>
                )}
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
                  placeholder="••••••••"
                  required
                  className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-primary h-11"
                />
                {validationErrors.password && (
                  <p className="text-sm text-destructive">{validationErrors.password}</p>
                )}
              </div>

              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-primary h-11"
                  />
                  {validationErrors.confirmPassword && (
                    <p className="text-sm text-destructive">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="group relative w-full bg-slate-950/80 hover:bg-slate-900 text-white font-serif text-sm tracking-[0.2em] uppercase rounded-full h-12 transition-all duration-500 overflow-hidden border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]"
                disabled={loading}
              >
                <div className="absolute inset-1 border border-white/10 rounded-full pointer-events-none transition-colors duration-500 group-hover:border-white/30" />
                <span className="relative z-10 font-medium opacity-90 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
                </span>
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-2 pt-0">
            <p className="text-sm text-slate-400 text-center">
              {mode === 'login' ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
            </p>
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
            >
              {mode === 'login' ? 'Criar nova conta' : 'Voltar para o login'}
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
