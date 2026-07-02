import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { requestPasswordReset, resetPassword } from '@/services/password-reset'

interface ForgotPasswordProps {
  initialEmail?: string
  onBack: () => void
}

type Step = 'email' | 'code' | 'password' | 'success'

export function ForgotPassword({ initialEmail, onBack }: ForgotPasswordProps) {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState(initialEmail || '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const inputClass =
    'bg-[#050505] border-neutral-800 text-neutral-100 placeholder:text-neutral-700 focus-visible:ring-0 focus-visible:border-primary/50 h-12 rounded-none font-sans px-4'
  const labelClass =
    'text-[0.65rem] font-sans font-light text-neutral-500 tracking-[0.15em] uppercase mb-1 block'
  const btnClass =
    'w-full bg-white text-black font-sans text-xs font-semibold tracking-[0.2em] uppercase rounded-none h-12 transition-colors hover:bg-neutral-200 disabled:opacity-50 mt-6'

  const passwordMeetsLength = newPassword.length >= 8
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0
  const canSubmitPassword = passwordMeetsLength && passwordsMatch

  const handleSendCode = async () => {
    setError(null)
    if (!email.trim()) {
      setError('Obrigatório')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email inválido')
      return
    }
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setStep('code')
      setCountdown(60)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setError(null)
    if (code.length !== 6) {
      setError('Código incompleto')
      return
    }
    setStep('password')
  }

  const handleResendCode = async () => {
    if (countdown > 0) return
    setError(null)
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setCountdown(60)
      setCode('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setError(null)
    if (!passwordMeetsLength) {
      setError('A senha deve ter no mínimo 8 caracteres')
      return
    }
    if (!passwordsMatch) {
      setError('As senhas não coincidem')
      return
    }
    setLoading(true)
    try {
      await resetPassword(email, code, newPassword)
      setStep('success')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    onBack()
  }

  if (step === 'success') {
    return (
      <div className="space-y-8 animate-fade-in-up">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full border border-primary/30 flex items-center justify-center">
            <Check className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
        </div>
        <div className="text-center space-y-3">
          <h3 className="text-base font-serif font-light tracking-[0.15em] text-white uppercase">
            Senha Atualizada
          </h3>
          <p className="text-[0.6rem] font-sans font-light text-neutral-500 tracking-[0.15em] uppercase leading-relaxed">
            Sua senha foi alterada com sucesso. Faça login com suas novas credenciais.
          </p>
        </div>
        <Button type="button" onClick={handleBackToLogin} className={btnClass}>
          Voltar ao Login
        </Button>
      </div>
    )
  }

  if (step === 'email') {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="text-center mb-6">
          <p className="text-[0.55rem] font-sans font-light text-neutral-500 tracking-[0.2em] uppercase leading-relaxed">
            Informe seu email cadastrado para receber o código de verificação
          </p>
        </div>

        <div>
          <Label htmlFor="fp-email" className={labelClass}>
            Email
          </Label>
          <Input
            id="fp-email"
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

        <button
          type="button"
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 text-[0.55rem] font-sans font-light text-neutral-500 hover:text-neutral-300 tracking-[0.15em] uppercase transition-colors pt-4"
        >
          <ArrowLeft className="w-3 h-3" strokeWidth={1.5} />
          Voltar ao Login
        </button>
      </div>
    )
  }

  if (step === 'code') {
    return (
      <div className="space-y-6 animate-fade-in-up">
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
          disabled={code.length !== 6}
          onClick={handleVerifyCode}
          className={btnClass}
        >
          CONTINUAR
        </Button>

        <div className="flex items-center justify-between pt-2">
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
              onClick={handleResendCode}
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

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="text-center mb-6">
        <p className="text-[0.55rem] font-sans font-light text-neutral-500 tracking-[0.2em] uppercase leading-relaxed">
          Digite sua nova senha
        </p>
      </div>

      <div>
        <Label htmlFor="fp-new-password" className={labelClass}>
          Nova Senha
        </Label>
        <div className="relative">
          <Input
            id="fp-new-password"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={cn(inputClass, 'pr-20')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[0.55rem] tracking-[0.1em] uppercase text-neutral-500 hover:text-primary transition-colors"
            tabIndex={-1}
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {newPassword.length > 0 && !passwordMeetsLength && (
          <p className="text-[0.6rem] text-primary/80 mt-1 uppercase tracking-wider">
            Mínimo 8 caracteres
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="fp-confirm-password" className={labelClass}>
          Confirmar Nova Senha
        </Label>
        <div className="relative">
          <Input
            id="fp-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={cn(inputClass, 'pr-20')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[0.55rem] tracking-[0.1em] uppercase text-neutral-500 hover:text-primary transition-colors"
            tabIndex={-1}
          >
            {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="text-[0.6rem] text-primary/80 mt-1 uppercase tracking-wider">
            As senhas não coincidem
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="bg-transparent border-primary/30 rounded-none">
          <AlertDescription className="text-primary text-[0.7rem] uppercase tracking-wider text-center font-light">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        disabled={loading || !canSubmitPassword}
        onClick={handleResetPassword}
        className={btnClass}
      >
        {loading ? 'SALVANDO...' : 'SALVAR NOVA SENHA'}
      </Button>

      <button
        type="button"
        onClick={() => {
          setStep('code')
          setError(null)
          setNewPassword('')
          setConfirmPassword('')
        }}
        className="w-full flex items-center justify-center gap-2 text-[0.55rem] font-sans font-light text-neutral-500 hover:text-neutral-300 tracking-[0.15em] uppercase transition-colors pt-2"
      >
        <ArrowLeft className="w-3 h-3" strokeWidth={1.5} />
        Voltar
      </button>
    </div>
  )
}
