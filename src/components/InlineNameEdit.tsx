import { useState, useRef, useEffect } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Loader2, Check } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { updateUser } from '@/services/users'
import pb from '@/lib/pocketbase/client'

export function InlineNameEdit() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayName = user?.name?.trim() || user?.email?.trim() || 'Usuário'

  useEffect(() => {
    if (open) {
      setName(user?.name || '')
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [open, user])

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast({
        title: 'Erro de validação',
        description: 'O nome não pode estar vazio.',
        variant: 'destructive',
      })
      return
    }
    if (trimmed === (user?.name || '')) {
      setOpen(false)
      return
    }
    setIsSaving(true)
    try {
      await updateUser(user.id, { name: trimmed })
      try {
        await pb.collection('users').authRefresh()
      } catch {
        // Token may still be valid; ignore refresh failure
      }
      toast({ title: 'Sucesso', description: 'Nome atualizado com sucesso.' })
      setOpen(false)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o nome. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className="group hidden sm:flex items-center gap-2 cursor-pointer">
      <span className="text-[0.6rem] font-light tracking-[0.2em] uppercase text-neutral-500 max-w-[180px] truncate group-hover:text-neutral-300 transition-colors duration-200">
        {displayName}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="text-neutral-600 hover:text-primary focus:outline-none focus:text-primary transition-opacity duration-200 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
            aria-label="Editar nome"
          >
            <Pencil size={12} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 p-3 bg-black border-neutral-800 rounded-none"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-3">
            <label className="block text-[0.6rem] tracking-[0.2em] uppercase text-neutral-500">
              Editar Nome
            </label>
            <Input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Seu nome"
              className="h-8 text-sm bg-transparent border-neutral-800 rounded-none"
              disabled={isSaving}
              maxLength={100}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isSaving}
                className="h-7 text-xs tracking-wider uppercase font-light text-neutral-500 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
                className="h-7 text-xs tracking-wider uppercase font-light gap-1 rounded-none"
              >
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Salvar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
