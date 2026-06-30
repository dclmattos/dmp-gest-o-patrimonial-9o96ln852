import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2, AlertCircle, Hexagon } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface OtpLoginProps {
  onSuccess: () => void
  initialEmail?: string
}

export function OtpLogin({ onSuccess, initialEmail }: OtpLoginProps) {
  const { requestOtp, verifyOtp } = useAuth()
  const { toast } = useToast()

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState(initialEmail || '')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSendCode = async () => {
    setError(null)
    if (!email.trim()) {
      setError('Email é obrigatório.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email inválido.')
      return
    }
    setLoading(true)
    const { error } = await requestOtp(email)
    setLoading(false)
    if (error) {
      setError(getErrorMessage(error))
    } else {
      setStep('code')
      setCountdown(60)
      toast({
        title: 'Código enviado',
        description: `Verifique seu email: ${email}`,
      })
    }
  }

  const handleVerify = async () => {
    setError(null)
    if (code.length !== 6) {
      setError('Digite o código completo de 6 dígitos.')
      return
    }
    setLoading(true)
    const { error } = await verifyOtp(email, code)
    setLoading(false)
    if (error) {
      setError('Código inválido ou expirado.')
      setCode('')
    } else {
      onSuccess()
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setError(null)
    setLoading(true)
    const { error } = await requestOtp(email)
    setLoading(false)
    if (error) {
      setError(getErrorMessage(error))
    } else {
      setCountdown(60)
      setCode('')
      toast({
        title: 'Código reenviado',
        description: `Verifique seu email: ${email}`,
      })
    }
  }

  if (step === 'email') {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="otp-email"
            className="text-xs font-sans font-light text-neutral-400 tracking-[0.15em] uppercase"
          >
            Email de Acesso
          </Label>
          <Input
            id="otp-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="bg-black/40 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-primary/40 focus-visible:border-primary/40 h-12 rounded-sm font-sans"
            onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
          />
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="bg-destructive/5 border-destructive/20 rounded-sm"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-destructive text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="button"
          disabled={loading}
          onClick={handleSendCode}
          className="group relative w-full bg-white text-black font-sans text-xs tracking-[0.25em] uppercase rounded-sm h-12 transition-all duration-500 overflow-hidden border border-white/10 hover:bg-neutral-200 disabled:opacity-50"
        >
          <span className="relative z-10 font-medium flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Enviando...' : 'Enviar Código'}
          </span>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <div className="flex justify-center mb-3">
          <Hexagon size={20} strokeWidth={1} className="text-primary/60" />
        </div>
        <p className="text-[0.65rem] font-sans font-light text-neutral-500 tracking-[0.2em] uppercase">
          Código enviado para
        </p>
        <p className="text-sm font-sans font-light text-neutral-300">{email}</p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 rounded-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-destructive text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center">
        <InputOTP maxLength={6} value={code} onChange={(value) => setCode(value)}>
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="w-11 h-12 bg-black/40 border-neutral-800 text-neutral-100 text-lg font-light first:rounded-l-sm last:rounded-r-sm"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        type="button"
        disabled={loading || code.length !== 6}
        onClick={handleVerify}
        className="group relative w-full bg-white text-black font-sans text-xs tracking-[0.25em] uppercase rounded-sm h-12 transition-all duration-500 overflow-hidden border border-white/10 hover:bg-neutral-200 disabled:opacity-50"
      >
        <span className="relative z-10 font-medium flex items-center justify-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Verificando...' : 'Verificar Código'}
        </span>
      </Button>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setStep('email')
            setError(null)
            setCode('')
          }}
          className="flex items-center gap-1 text-[0.65rem] font-sans font-light text-neutral-600 hover:text-neutral-400 tracking-[0.15em] uppercase transition-colors duration-200"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          Voltar
        </button>
        {countdown > 0 ? (
          <span className="text-[0.65rem] font-sans font-light text-neutral-600 tracking-[0.15em] uppercase">
            Reenviar em {countdown}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="text-[0.65rem] font-sans font-light text-primary/70 hover:text-primary tracking-[0.15em] uppercase transition-colors duration-200 disabled:opacity-50"
          >
            Reenviar código
          </button>
        )}
      </div>
    </div>
  )
}
