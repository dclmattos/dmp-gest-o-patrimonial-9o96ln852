import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getErrorMessage, extractFieldErrors } from '@/lib/pocketbase/errors'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OtpLogin } from '@/components/OtpLogin'
import { ForgotPassword } from '@/components/ForgotPassword'

type Mode = 'login' | 'signup'
type AuthMethod = 'password' | 'otp' | 'forgot'

export default function Auth() {
  const { signIn, signUp, signInWithGoogle, isAuthenticated, user } = useAuth()
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password')
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const otpLoginRef = useRef(false)

  useEffect(() => {
    setEmail('')
    setPassword('')
    setName('')
    setConfirmPassword('')
    setError(null)
    setValidationErrors({})
  }, [])

  if (isAuthenticated) {
    if (otpLoginRef.current) return <Navigate to="/patrimonio" replace />
    if (user?.role === 'user') return <Navigate to="/my-portfolio" replace />
    return <Navigate to="/" replace />
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (mode === 'signup' && !name.trim()) errors.name = 'Obrigatório'
    if (!email.trim()) errors.email = 'Obrigatório'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Inválido'
    if (!password) errors.password = 'Obrigatório'
    else if (password.length < 8) errors.password = 'Mínimo 8 caracteres'
    if (mode === 'signup') {
      if (!confirmPassword) errors.confirmPassword = 'Obrigatório'
      else if (password !== confirmPassword) errors.confirmPassword = 'Não coincidem'
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationErrors({})
    if (!validate()) return
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) {
          const fieldErrs = extractFieldErrors(error)
          if (Object.keys(fieldErrs).length > 0) setValidationErrors(fieldErrs)
          setError(getErrorMessage(error))
        }
      } else {
        const { error } = await signUp(email, password, name)
        if (error) {
          const fieldErrs = extractFieldErrors(error)
          if (Object.keys(fieldErrs).length > 0) setValidationErrors(fieldErrs)
          setError(getErrorMessage(error))
        }
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)
    setValidationErrors({})
    try {
      const { error } = await signInWithGoogle()
      if (error) setError(getErrorMessage(error))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setGoogleLoading(false)
    }
  }

  const switchMode = (newMode: Mode) => {
    setMode(newMode)
    setError(null)
    setValidationErrors({})
    if (newMode === 'login') {
      setEmail('')
      setPassword('')
      setName('')
      setConfirmPassword('')
    }
  }

  const switchMethod = (method: AuthMethod) => {
    setAuthMethod(method)
    setError(null)
    setValidationErrors({})
    setEmail('')
    setPassword('')
    setName('')
    setConfirmPassword('')
  }

  const title =
    authMethod === 'otp'
      ? 'CÓDIGO DE ACESSO'
      : authMethod === 'forgot'
        ? 'RECUPERAÇÃO DE SENHA'
        : mode === 'login'
          ? 'ACESSO RESTRITO'
          : 'NOVO CADASTRO'
  const subtitle =
    authMethod === 'otp'
      ? 'VALIDAÇÃO DE IDENTIDADE'
      : authMethod === 'forgot'
        ? 'REDEFINIÇÃO SEGURA DE CREDENCIAIS'
        : 'PLATAFORMA DE INTELIGÊNCIA PATRIMONIAL'

  const inputClass =
    'bg-[#050505] border-neutral-800 text-neutral-100 placeholder:text-neutral-700 focus-visible:ring-0 focus-visible:border-primary/50 h-12 rounded-none font-sans px-4'
  const labelClass =
    'text-[0.65rem] font-sans font-light text-neutral-500 tracking-[0.15em] uppercase mb-1 block'
  const btnClass =
    'w-full bg-white text-black font-sans text-xs font-semibold tracking-[0.2em] uppercase rounded-none h-12 transition-colors hover:bg-neutral-200 disabled:opacity-50 mt-4'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-black text-neutral-100 relative overflow-hidden">
      <div className="absolute top-8 left-8 sm:top-12 sm:left-12 opacity-80 pointer-events-none">
        <div className="relative px-5 py-3 inline-block">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary" />
          <span className="text-[0.65rem] sm:text-xs font-light tracking-[0.3em] uppercase text-primary/90">
            Gestão Patrimonial
          </span>
        </div>
      </div>

      <div className="z-10 w-full max-w-sm animate-fade-in-up">
        <div className="flex items-center justify-center gap-4 mb-10">
          <button
            type="button"
            onClick={() => switchMethod('password')}
            className={cn(
              'text-[0.6rem] font-sans font-light tracking-[0.2em] uppercase transition-colors duration-300',
              authMethod === 'password' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400',
            )}
          >
            Senha
          </button>
          <div className="w-px h-3 bg-neutral-800" />
          <button
            type="button"
            onClick={() => switchMethod('otp')}
            className={cn(
              'text-[0.6rem] font-sans font-light tracking-[0.2em] uppercase transition-colors duration-300',
              authMethod === 'otp' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400',
            )}
          >
            Código Único
          </button>
        </div>

        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-2xl font-serif font-light tracking-[0.25em] text-white uppercase mb-3">
            {title}
          </h2>
          <p className="text-[0.55rem] sm:text-[0.6rem] font-sans font-light text-primary/70 tracking-[0.2em] uppercase">
            {subtitle}
          </p>
        </div>

        {authMethod === 'forgot' ? (
          <ForgotPassword initialEmail={email} onBack={() => switchMethod('password')} />
        ) : authMethod === 'password' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <Label htmlFor="name" className={labelClass}>
                  Nome
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  disabled={loading}
                />
                {validationErrors.name && (
                  <p className="text-[0.6rem] text-primary/80 mt-1 uppercase tracking-wider">
                    {validationErrors.name}
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="email" className={labelClass}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                disabled={loading}
              />
              {validationErrors.email && (
                <p className="text-[0.6rem] text-primary/80 mt-1 uppercase tracking-wider">
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className={labelClass}>
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(inputClass, 'pr-20')}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[0.55rem] tracking-[0.1em] uppercase text-neutral-500 hover:text-primary transition-colors disabled:opacity-40"
                  tabIndex={-1}
                  disabled={loading}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-[0.6rem] text-primary/80 mt-1 uppercase tracking-wider">
                  {validationErrors.password}
                </p>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <Label htmlFor="confirmPassword" className={labelClass}>
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(inputClass, 'pr-20')}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[0.55rem] tracking-[0.1em] uppercase text-neutral-500 hover:text-primary transition-colors disabled:opacity-40"
                    tabIndex={-1}
                    disabled={loading}
                  >
                    {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-[0.6rem] text-primary/80 mt-1 uppercase tracking-wider">
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {error && (
              <Alert
                variant="destructive"
                className="bg-transparent border-primary/30 rounded-none mt-4"
              >
                <AlertDescription className="text-primary text-[0.7rem] uppercase tracking-wider text-center font-light">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading} className={btnClass}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  PROCESSANDO...
                </span>
              ) : mode === 'login' ? (
                'ENTRAR'
              ) : (
                'CRIAR CONTA'
              )}
            </Button>

            {mode === 'login' && (
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => switchMethod('forgot')}
                  className="text-[0.55rem] font-sans font-light tracking-[0.15em] uppercase text-neutral-600 hover:text-primary transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-black px-4 text-[0.5rem] font-sans font-light text-neutral-700 tracking-[0.3em] uppercase">
                  Ou
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full bg-[#050505] border border-neutral-800 text-neutral-100 font-sans text-xs font-semibold tracking-[0.2em] uppercase rounded-none h-12 transition-colors hover:border-primary/50 hover:bg-neutral-900/50 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {googleLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  CONECTANDO...
                </span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  CONTINUAR COM GOOGLE
                </>
              )}
            </button>
          </form>
        ) : (
          <OtpLogin
            initialEmail={email}
            onSuccess={() => {
              otpLoginRef.current = true
            }}
          />
        )}

        {authMethod === 'password' && (
          <div className="mt-12 flex flex-col items-center">
            <p className="text-[0.55rem] text-neutral-600 uppercase tracking-[0.15em] mb-3">
              {mode === 'login' ? 'Ainda não possui acesso?' : 'Já tem uma conta?'}
            </p>
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              className="text-[0.6rem] font-sans font-medium tracking-[0.2em] uppercase text-primary hover:text-primary/70 transition-colors"
            >
              {mode === 'login' ? 'Solicitar Cadastro' : 'Voltar ao Login'}
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none w-full">
        <p className="text-[0.5rem] sm:text-[0.55rem] font-sans font-light text-neutral-800 tracking-[0.4em] uppercase">
          Strategic Wealth Platform
        </p>
      </div>
    </div>
  )
}
