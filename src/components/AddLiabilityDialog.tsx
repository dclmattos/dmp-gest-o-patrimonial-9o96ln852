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
import { Plus } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createLiability } from '@/services/liabilities'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export function AddLiabilityDialog({ assetId }: { assetId?: string }) {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const [assetUserId, setAssetUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!assetId) {
      setAssetUserId(null)
      return
    }
    pb.collection('assets')
      .getOne(assetId)
      .then((asset) => setAssetUserId(asset.user || null))
      .catch(() => setAssetUserId(null))
  }, [assetId])

  const [name, setName] = useState('')
  const [totalValue, setTotalValue] = useState('')
  const [remainingBalance, setRemainingBalance] = useState('')
  const [monthlyInstallment, setMonthlyInstallment] = useState('')
  const [dueDate, setDueDate] = useState('')

  const [startDate, setStartDate] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [monthlyDueDay, setMonthlyDueDay] = useState('')
  const [hasEndDate, setHasEndDate] = useState(false)
  const [endDate, setEndDate] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const targetUserId = assetId ? assetUserId : user.id
    if (assetId && !targetUserId) return

    if (hasEndDate && endDate && startDate && new Date(endDate) < new Date(startDate)) {
      toast({
        title: 'Data inválida',
        description: 'A data de término não pode ser anterior à data de início.',
        variant: 'destructive',
      })
      return
    }

    try {
      await createLiability({
        user: targetUserId,
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
        ...(assetId ? { asset: assetId } : {}),
      })
      toast({ title: 'Sucesso', description: 'Obrigação adicionada com sucesso.' })
      setOpen(false)
      setName('')
      setTotalValue('')
      setRemainingBalance('')
      setMonthlyInstallment('')
      setDueDate('')
      setStartDate('')
      setIsRecurring(false)
      setMonthlyDueDay('')
      setHasEndDate(false)
      setEndDate('')
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao adicionar obrigação.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-rose-700 hover:text-rose-800 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950 border-rose-200 dark:border-rose-900"
        >
          <Plus size={14} /> Nova Obrigação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Obrigação / Passivo</DialogTitle>
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
            </div>
            <div className="space-y-2">
              <Label>Saldo Devedor (Opcional)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={remainingBalance}
                onChange={(e) => setRemainingBalance(e.target.value)}
                placeholder="Igual ao total"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Parcela Mensal (Opcional)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={monthlyInstallment}
                onChange={(e) => setMonthlyInstallment(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input
                required
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
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
            </div>
          )}

          <Button type="submit" className="w-full">
            Salvar Obrigação
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
