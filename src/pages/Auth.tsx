import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'
import { OtpLogin } from '@/components/OtpLogin'

type Mode = 'login' | 'signup'
type AuthMethod = 'password' | 'otp'

export default function Auth() {
  const { signIn, signUp, isAuthenticated, user } = useAuth()
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password')
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('dclmattos@gmail.com')
  const [password, setPassword] = useState('Skip@Pass')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const otpLoginRef = useRef(false)

  if (isAuthenticated) {
    if (otpLoginRef.current) return <Navigate to="/patrimonio" replace />
    if (user?.role === 'user') return <Navigate to="/my-portfolio" replace />
    return <Navigate to="/" replace />
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (mode === 'signup' && !name.trim()) errors.name = 'Nome é obrigatório.'
    if (!email.trim()) errors.email = 'Email é obrigatório.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email inválido.'
    if (!password) errors.password = 'Senha é obrigatória.'
    else if (password.length < 8) errors.password = 'A senha deve ter no mínimo 8 caracteres.'
    if (mode === 'signup') {
      if (!confirmPassword) errors.confirmPassword = 'Confirmação de senha é obrigatória.'
      else if (password !== confirmPassword) errors.confirmPassword = 'As senhas não coincidem.'
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
        if (error) setError(getErrorMessage(error))
      } else {
        const { error } = await signUp(email, password)
        if (error) setError(getErrorMessage(error))
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

  const switchMethod = (method: AuthMethod) => {
    setAuthMethod(method)
    setError(null)
    setValidationErrors({})
  }

  const title =
    authMethod === 'otp'
      ? 'Acesso por Código'
      : mode === 'login'
        ? 'Acesso Restrito'
        : 'Novo Cadastro'
  const subtitle =
    authMethod === 'otp'
      ? 'Senha Única de Acesso'
      : mode === 'login'
        ? 'Plataforma de Inteligência Patrimonial'
        : 'Ingresso no Cofre Estratégico'

  const inputClass =
    'bg-black/40 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-primary/40 focus-visible:border-primary/40 h-12 rounded-sm font-sans'
  const labelClass = 'text-xs font-sans font-light text-neutral-400 tracking-[0.15em] uppercase'
  const btnClass =
    'group relative w-full bg-white text-black font-sans text-xs tracking-[0.25em] uppercase rounded-sm h-12 transition-all duration-500 overflow-hidden border border-white/10 hover:bg-neutral-200 disabled:opacity-50'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-black text-neutral-100 relative overflow-hidden">
      <img
        src="https://img.usecurling.com/p/1920/1080?q=dark%20abstract%20luxury%20gold%20geometry&color=black&dpr=2"
        alt=""
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/50 z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-transparent to-black z-0" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 blur-[120px] rounded-full z-0 pointer-events-none" />

      <div className="z-10 w-full max-w-md mb-8 sm:absolute sm:top-10 sm:left-10 sm:mb-0 sm:w-auto flex justify-center sm:justify-start pointer-events-none opacity-90 animate-fade-in">
        <div className="relative">
          <div className="absolute -top-px -left-px w-3 h-3 border-t border-l border-primary/60" />
          <div className="absolute -top-px -right-px w-3 h-3 border-t border-r border-primary/60" />
          <div className="absolute -bottom-px -left-px w-3 h-3 border-b border-l border-primary/60" />
          <div className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-primary/60" />
          <div className="px-6 py-5">
            <h1 className="flex flex-col text-center sm:text-left font-sans text-white antialiased">
              <span className="text-3xl sm:text-4xl font-light tracking-[0.4em] leading-none uppercase">
                DMP
              </span>
              <span className="text-[0.65rem] sm:text-xs font-light tracking-[0.3em] uppercase mt-2 text-primary/80">
                Gestão Patrimonial
              </span>
            </h1>
          </div>
        </div>
      </div>

      <div className="z-10 w-full max-w-md animate-fade-in-up">
        <Card className="bg-neutral-950/70 backdrop-blur-2xl border-neutral-800/50 shadow-2xl rounded-sm">
          <CardHeader className="space-y-2 text-center pb-2 pt-8">
            <div className="mx-auto w-px h-8 bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
            <div className="flex items-center justify-center gap-1 mb-1">
              <button
                type="button"
                onClick={() => switchMethod('password')}
                className={cn(
                  'px-4 py-1.5 text-[0.6rem] font-sans font-light tracking-[0.2em] uppercase transition-all duration-300',
                  authMethod === 'password'
                    ? 'text-white'
                    : 'text-neutral-600 hover:text-neutral-400',
                )}
              >
                Senha
              </button>
              <div className="w-px h-3 bg-neutral-800" />
              <button
                type="button"
                onClick={() => switchMethod('otp')}
                className={cn(
                  'px-4 py-1.5 text-[0.6rem] font-sans font-light tracking-[0.2em] uppercase transition-all duration-300',
                  authMethod === 'otp' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400',
                )}
              >
                Código Único
              </button>
            </div>
            <h2 className="text-lg font-sans font-light tracking-[0.25em] text-white uppercase">
              {title}
            </h2>
            <p className="text-[0.6rem] font-sans font-light text-neutral-500 tracking-[0.2em] uppercase">
              {subtitle}
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            {authMethod === 'password' ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className={labelClass}>
                      Nome
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      className={inputClass}
                    />
                    {validationErrors.name && (
                      <p className="text-xs text-destructive">{validationErrors.name}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className={labelClass}>
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className={inputClass}
                  />
                  {validationErrors.email && (
                    <p className="text-xs text-destructive">{validationErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className={labelClass}>
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={cn(inputClass, 'pr-12')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-primary/70 transition-colors duration-200"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff size={18} strokeWidth={1.5} />
                      ) : (
                        <Eye size={18} strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-xs text-destructive">{validationErrors.password}</p>
                  )}
                </div>

                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className={labelClass}>
                      Confirmar Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className={cn(inputClass, 'pr-12')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-primary/70 transition-colors duration-200"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} strokeWidth={1.5} />
                        ) : (
                          <Eye size={18} strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <p className="text-xs text-destructive">{validationErrors.confirmPassword}</p>
                    )}
                  </div>
                )}

                {error && (
                  <Alert
                    variant="destructive"
                    className="bg-destructive/5 border-destructive/20 rounded-sm"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-destructive text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={loading} className={btnClass}>
                  <span className="relative z-10 font-medium flex items-center justify-center gap-2">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
                  </span>
                </Button>
              </form>
            ) : (
              <OtpLogin
                initialEmail={email}
                onSuccess={() => {
                  otpLoginRef.current = true
                }}
              />
            )}
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-3 pt-2 pb-8">
            <div className="w-12 h-px bg-neutral-800" />
            {authMethod === 'password' ? (
              <>
                <p className="text-xs text-neutral-500 text-center font-sans font-light tracking-wide">
                  {mode === 'login' ? 'Ainda não possui acesso?' : 'Já tem uma conta?'}
                </p>
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-xs font-sans tracking-[0.15em] uppercase text-primary/80 hover:text-primary transition-colors duration-200"
                >
                  {mode === 'login' ? 'Solicitar Cadastro' : 'Voltar ao Login'}
                </button>
              </>
            ) : (
              <p className="text-[0.6rem] font-sans font-light text-neutral-600 tracking-[0.2em] uppercase text-center">
                Senha única válida por 10 minutos
              </p>
            )}
          </CardFooter>
        </Card>
      </div>

      <div className="z-10 absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <p className="text-[0.55rem] font-sans font-light text-neutral-700 tracking-[0.3em] uppercase">
          DMP · Strategic Wealth Platform
        </p>
      </div>
    </div>
  )
}
