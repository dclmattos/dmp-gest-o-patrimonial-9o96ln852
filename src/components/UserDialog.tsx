import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { createUser, updateUser } from '@/services/users'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: { id: string; name: string; email: string; role: string } | null
  onSaved?: () => void
}

export function UserDialog({ open, onOpenChange, user, onSaved }: UserDialogProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('user')

  useEffect(() => {
    if (open) {
      setFieldErrors({})
      setShowPassword(false)
      if (user) {
        setName(user.name || '')
        setEmail(user.email || '')
        setRole(user.role || 'user')
        setPassword('')
      } else {
        setName('')
        setEmail('')
        setPassword('')
        setRole('user')
      }
    }
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    if (password && password.length < 8) {
      const msg = 'A senha deve ter no mínimo 8 caracteres.'
      setFieldErrors({ password: msg })
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
      return
    }

    setIsSaving(true)
    try {
      if (user) {
        const data: Record<string, string> = { name, email, role }
        if (password) {
          data.password = password
          data.passwordConfirm = password
        }
        await updateUser(user.id, data)
        toast({
          title: 'Sucesso',
          description: password
            ? 'Usuário e senha atualizados com sucesso.'
            : 'Usuário atualizado com sucesso.',
        })
      } else {
        await createUser({
          name,
          email,
          password,
          passwordConfirm: password,
          role,
        })
        toast({ title: 'Sucesso', description: 'Usuário criado com sucesso.' })
      }
      onSaved?.()
      onOpenChange(false)
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast({
        title: 'Erro',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{user ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-6">
          <form id="user-form" onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva"
                className={fieldErrors.name ? 'border-red-500' : ''}
              />
              {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className={fieldErrors.email ? 'border-red-500' : ''}
              />
              {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label>{user ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={user ? '••••••••' : 'Mínimo 8 caracteres'}
                  className={cn('pr-10', fieldErrors.password ? 'border-red-500' : '')}
                  required={!user}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setShowPassword((prev) => !prev)
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-primary transition-colors duration-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  tabIndex={0}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-sm text-red-500">{fieldErrors.password}</p>
              )}
              {password && password.length > 0 && password.length < 8 && !fieldErrors.password && (
                <p className="text-sm text-amber-500">
                  A senha deve ter no mínimo 8 caracteres ({password.length}/8).
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className={fieldErrors.role ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Cliente</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.role && <p className="text-sm text-red-500">{fieldErrors.role}</p>}
            </div>
          </form>
        </ScrollArea>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/40">
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button type="submit" form="user-form" disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {user ? 'Salvar Alterações' : 'Criar Usuário'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
