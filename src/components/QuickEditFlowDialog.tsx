import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { updateReceivable } from '@/services/receivables'
import { updateLiability } from '@/services/liabilities'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { CheckCircle2 } from 'lucide-react'

interface QuickEditFlowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'receivable' | 'liability'
  record: any
}

export function QuickEditFlowDialog({
  open,
  onOpenChange,
  type,
  record,
}: QuickEditFlowDialogProps) {
  const { toast } = useToast()
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [amount, setAmount] = useState('')
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    if (open && record) {
      const currentAmount =
        type === 'receivable'
          ? record.amount
          : record.monthly_installment || record.remaining_balance
      setAmount(currentAmount ? currentAmount.toString() : '')
      setIsDone(record.is_done || false)
      setFieldErrors({})
    }
  }, [open, record, type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    try {
      if (type === 'receivable') {
        await updateReceivable(record.id, {
          amount: Number(amount),
          is_done: isDone,
        })
      } else {
        await updateLiability(record.id, {
          monthly_installment: Number(amount),
          is_done: isDone,
        })
      }
      toast({ title: 'Sucesso', description: 'Fluxo atualizado com sucesso.' })
      onOpenChange(false)
    } catch (err: any) {
      setFieldErrors(extractFieldErrors(err))
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar fluxo. Verifique os campos.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-muted-foreground" />
            Edição Rápida
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{type === 'receivable' ? 'Valor da Entrada' : 'Valor da Parcela'}</Label>
            <Input
              required
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            {fieldErrors.amount && <p className="text-sm text-red-500">{fieldErrors.amount}</p>}
            {fieldErrors.monthly_installment && (
              <p className="text-sm text-red-500">{fieldErrors.monthly_installment}</p>
            )}
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg dark:border-slate-800">
            <div className="space-y-0.5">
              <Label className="font-medium">Efetuado</Label>
              <p className="text-xs text-muted-foreground">Marcar como concluído</p>
            </div>
            <Switch checked={isDone} onCheckedChange={setIsDone} />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
