import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Pencil } from 'lucide-react'
import { updateLiability } from '@/services/liabilities'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

export function EditLiabilityDialog({ liability }: { liability: any }) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const [name, setName] = useState(liability.name)
  const [totalValue, setTotalValue] = useState(
    liability.total_value ? liability.total_value.toString() : '',
  )
  const [remainingBalance, setRemainingBalance] = useState(
    liability.remaining_balance ? liability.remaining_balance.toString() : '',
  )
  const [monthlyInstallment, setMonthlyInstallment] = useState(
    liability.monthly_installment ? liability.monthly_installment.toString() : '',
  )
  const [dueDate, setDueDate] = useState(
    liability.due_date ? liability.due_date.substring(0, 10) : '',
  )

  const [startDate, setStartDate] = useState(
    liability.start_date ? liability.start_date.substring(0, 10) : '',
  )
  const [isRecurring, setIsRecurring] = useState(liability.is_recurring)
  const [monthlyDueDay, setMonthlyDueDay] = useState(
    liability.monthly_due_day ? liability.monthly_due_day.toString() : '',
  )
  const [hasEndDate, setHasEndDate] = useState(!!liability.end_date)
  const [endDate, setEndDate] = useState(
    liability.end_date ? liability.end_date.substring(0, 10) : '',
  )

  useEffect(() => {
    if (open) {
      setName(liability.name)
      setTotalValue(liability.total_value ? liability.total_value.toString() : '')
      setRemainingBalance(liability.remaining_balance ? liability.remaining_balance.toString() : '')
      setMonthlyInstallment(
        liability.monthly_installment ? liability.monthly_installment.toString() : '',
      )
      setDueDate(liability.due_date ? liability.due_date.substring(0, 10) : '')
      setStartDate(liability.start_date ? liability.start_date.substring(0, 10) : '')
      setIsRecurring(liability.is_recurring)
      setMonthlyDueDay(liability.monthly_due_day ? liability.monthly_due_day.toString() : '')
      setHasEndDate(!!liability.end_date)
      setEndDate(liability.end_date ? liability.end_date.substring(0, 10) : '')
      setFieldErrors({})
    }
  }, [open, liability])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    if (hasEndDate && endDate && startDate && new Date(endDate) < new Date(startDate)) {
      toast({
        title: 'Data inválida',
        description: 'A data de término não pode ser anterior à data de início.',
        variant: 'destructive',
      })
      return
    }

    try {
      await updateLiability(liability.id, {
        name,
        total_value: totalValue ? Number(totalValue) : null,
        remaining_balance: remainingBalance ? Number(remainingBalance) : Number(totalValue),
        monthly_installment: monthlyInstallment ? Number(monthlyInstallment) : null,
        due_date:
          !isRecurring && dueDate ? new Date(dueDate + 'T12:00:00.000Z').toISOString() : null,
        start_date: startDate ? new Date(startDate + 'T12:00:00.000Z').toISOString() : null,
        is_recurring: isRecurring,
        monthly_due_day: isRecurring && monthlyDueDay ? Number(monthlyDueDay) : null,
        end_date: hasEndDate && endDate ? new Date(endDate + 'T12:00:00.000Z').toISOString() : null,
      })
      toast({ title: 'Sucesso', description: 'Obrigação atualizada com sucesso.' })
      setOpen(false)
    } catch (err: any) {
      setFieldErrors(extractFieldErrors(err))
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar obrigação. Verifique os campos.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="text-slate-400 hover:text-rose-600 transition-colors p-2 bg-background rounded-full shadow-sm border border-border/50 cursor-pointer"
          title="Editar Obrigação"
        >
          <Pencil size={14} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Obrigação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Financiamento de Veículo"
            />
            {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Total</Label>
              <Input
                required={!isRecurring}
                type="number"
                step="0.01"
                min="0"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                placeholder="0.00"
              />
              {fieldErrors.total_value && (
                <p className="text-sm text-red-500">{fieldErrors.total_value}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Saldo Devedor</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={remainingBalance}
                onChange={(e) => setRemainingBalance(e.target.value)}
                placeholder="0.00"
              />
              {fieldErrors.remaining_balance && (
                <p className="text-sm text-red-500">{fieldErrors.remaining_balance}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Parcela Mensal</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={monthlyInstallment}
                onChange={(e) => setMonthlyInstallment(e.target.value)}
                placeholder="0.00"
              />
              {fieldErrors.monthly_installment && (
                <p className="text-sm text-red-500">{fieldErrors.monthly_installment}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input
                required
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {fieldErrors.start_date && (
                <p className="text-sm text-red-500">{fieldErrors.start_date}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg dark:border-slate-800">
            <div className="space-y-0.5">
              <Label>Despesa Recorrente</Label>
              <p className="text-xs text-muted-foreground">Obrigação se repete mensalmente</p>
            </div>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>

          {isRecurring ? (
            <div className="space-y-2 animate-fade-in-down">
              <Label>Dia de Vencimento Mensal</Label>
              <Input
                required={isRecurring}
                type="number"
                min="1"
                max="31"
                value={monthlyDueDay}
                onChange={(e) => setMonthlyDueDay(e.target.value)}
                placeholder="Ex: 5"
              />
              {fieldErrors.monthly_due_day && (
                <p className="text-sm text-red-500">{fieldErrors.monthly_due_day}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2 animate-fade-in-up">
              <Label>Data de Vencimento</Label>
              <Input
                required={!isRecurring}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              {fieldErrors.due_date && (
                <p className="text-sm text-red-500">{fieldErrors.due_date}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between p-3 border rounded-lg dark:border-slate-800">
            <div className="space-y-0.5">
              <Label>Data de Término</Label>
              <p className="text-xs text-muted-foreground">Marque para definir fim da obrigação</p>
            </div>
            <Switch checked={hasEndDate} onCheckedChange={setHasEndDate} />
          </div>

          {hasEndDate && (
            <div className="space-y-2 animate-fade-in-down">
              <Label>Data de Término</Label>
              <Input
                required={hasEndDate}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {fieldErrors.end_date && (
                <p className="text-sm text-red-500">{fieldErrors.end_date}</p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full">
            Salvar Alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
