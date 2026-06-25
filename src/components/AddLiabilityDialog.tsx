import { useState } from 'react'
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
import { Plus } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createLiability } from '@/services/liabilities'
import { useToast } from '@/hooks/use-toast'

export function AddLiabilityDialog() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [totalValue, setTotalValue] = useState('')
  const [remainingBalance, setRemainingBalance] = useState('')
  const [monthlyInstallment, setMonthlyInstallment] = useState('')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      await createLiability({
        user: user.id,
        name,
        total_value: totalValue ? Number(totalValue) : null,
        remaining_balance: remainingBalance ? Number(remainingBalance) : Number(totalValue),
        monthly_installment: monthlyInstallment ? Number(monthlyInstallment) : null,
        due_date: dueDate ? new Date(dueDate + 'T12:00:00.000Z').toISOString() : null,
      })
      toast({ title: 'Sucesso', description: 'Obrigação adicionada com sucesso.' })
      setOpen(false)
      setName('')
      setTotalValue('')
      setRemainingBalance('')
      setMonthlyInstallment('')
      setDueDate('')
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
      <DialogContent>
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
                required
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
              <Label>Data de Vencimento</Label>
              <Input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Salvar Obrigação
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
