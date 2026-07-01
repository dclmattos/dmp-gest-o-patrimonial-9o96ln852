import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
      setError('Obrigatório')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Inválido')
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
      setError('Código incompleto')
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

  const inputClass =
    'bg-[#050505] border-neutral-800 text-neutral-100 placeholder:text-neutral-700 focus-visible:ring-0 focus-visible:border-primary/50 h-12 rounded-none font-sans px-4'
  const labelClass =
    'text-[0.65rem] font-sans font-light text-neutral-500 tracking-[0.15em] uppercase mb-1 block'
  const btnClass =
    'w-full bg-white text-black font-sans text-xs font-semibold tracking-[0.2em] uppercase rounded-none h-12 transition-colors hover:bg-neutral-200 disabled:opacity-50 mt-6'

  if (step === 'email') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="otp-email" className={labelClass}>
            Email
          </Label>
          <Input
            id="otp-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
          />
        </div>

        {error && (
          <Alert variant="destructive" className="bg-transparent border-primary/30 rounded-none">
            <AlertDescription className="text-primary text-[0.7rem] uppercase tracking-wider text-center font-light">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Button type="button" disabled={loading} onClick={handleSendCode} className={btnClass}>
          {loading ? 'ENVIANDO...' : 'ENVIAR CÓDIGO'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-6">
        <p className="text-[0.55rem] font-sans font-light text-neutral-500 tracking-[0.2em] uppercase">
          CÓDIGO ENVIADO PARA
        </p>
        <p className="text-xs font-sans font-medium text-neutral-300 tracking-wider">{email}</p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-transparent border-primary/30 rounded-none">
          <AlertDescription className="text-primary text-[0.7rem] uppercase tracking-wider text-center font-light">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center">
        <InputOTP maxLength={6} value={code} onChange={(value) => setCode(value)}>
          <InputOTPGroup className="gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="w-10 h-12 bg-[#050505] border border-neutral-800 text-neutral-100 text-lg font-light rounded-none focus-visible:border-primary/50 focus-visible:ring-0"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        type="button"
        disabled={loading || code.length !== 6}
        onClick={handleVerify}
        className={btnClass}
      >
        {loading ? 'VERIFICANDO...' : 'VERIFICAR'}
      </Button>

      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={() => {
            setStep('email')
            setError(null)
            setCode('')
          }}
          className="text-[0.55rem] font-sans font-light text-neutral-500 hover:text-neutral-300 tracking-[0.15em] uppercase transition-colors"
        >
          VOLTAR
        </button>
        {countdown > 0 ? (
          <span className="text-[0.55rem] font-sans font-light text-neutral-600 tracking-[0.15em] uppercase">
            REENVIAR EM {countdown}S
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="text-[0.55rem] font-sans font-medium text-primary hover:text-primary/70 tracking-[0.15em] uppercase transition-colors disabled:opacity-50"
          >
            REENVIAR CÓDIGO
          </button>
        )}
      </div>
    </div>
  )
}
