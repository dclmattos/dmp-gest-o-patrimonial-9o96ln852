import { useState, useEffect } from 'react'
import { format, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
import {
  createFlowOverride,
  updateFlowOverride,
  deleteFlowOverride,
} from '@/services/flow-overrides'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { CheckCircle2, RotateCcw } from 'lucide-react'

interface QuickEditFlowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'receivable' | 'liability'
  record: any
  month: Date | null
  existingOverride: any | null
}

export function QuickEditFlowDialog({
  open,
  onOpenChange,
  type,
  record,
  month,
  existingOverride,
}: QuickEditFlowDialogProps) {
  const { toast } = useToast()
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [amount, setAmount] = useState('')
  const [isDone, setIsDone] = useState(false)
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open && record) {
      const baseAmount =
        type === 'receivable'
          ? record.amount
          : record.monthly_installment || record.remaining_balance
      const currentAmount = existingOverride?.amount != null ? existingOverride.amount : baseAmount
      setAmount(currentAmount ? currentAmount.toString() : '')
      setIsDone(existingOverride?.is_done || false)
      setDescription(existingOverride?.description || '')
      setFieldErrors({})
    }
  }, [open, record, type, existingOverride])

  const baseAmountValue =
    type === 'receivable'
      ? record?.amount
      : record?.monthly_installment || record?.remaining_balance

  const handleReset = async () => {
    if (!existingOverride) return
    try {
      await deleteFlowOverride(existingOverride.id)
      toast({ title: 'Sucesso', description: 'Override removido. Valor base restaurado.' })
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: 'Falha ao remover override.',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    try {
      const monthDate = month
        ? format(startOfMonth(month), 'yyyy-MM-dd')
        : format(startOfMonth(new Date()), 'yyyy-MM-dd')
      const data = {
        user: record.user,
        flow_type: type,
        flow_id: record.id,
        month: monthDate,
        amount: Number(amount),
        is_done: isDone,
        description: description.trim(),
      }
      if (existingOverride) {
        await updateFlowOverride(existingOverride.id, data)
      } else {
        await createFlowOverride(data)
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
            {month && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                — {format(month, 'MMM/yyyy', { locale: ptBR })}
              </span>
            )}
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
            {baseAmountValue != null && (
              <p className="text-xs text-muted-foreground">
                Valor base:{' '}
                {baseAmountValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                {existingOverride?.amount != null && ' (editado neste mês)'}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição personalizada para este mês"
            />
            {fieldErrors.description && (
              <p className="text-sm text-red-500">{fieldErrors.description}</p>
            )}
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg dark:border-slate-800">
            <div className="space-y-0.5">
              <Label className="font-medium">Efetuado</Label>
              <p className="text-xs text-muted-foreground">Marcar como concluído neste mês</p>
            </div>
            <Switch checked={isDone} onCheckedChange={setIsDone} />
          </div>
          <DialogFooter className="gap-2">
            {existingOverride && (
              <Button
                type="button"
                variant="ghost"
                className="text-rose-600 hover:text-rose-700 mr-auto"
                onClick={handleReset}
              >
                <RotateCcw size={14} className="mr-1" />
                Restaurar Base
              </Button>
            )}
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
