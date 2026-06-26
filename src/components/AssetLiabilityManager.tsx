import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2 } from 'lucide-react'

export function AssetLiabilityManager({
  liabilities,
  setLiabilities,
}: {
  liabilities: any[]
  setLiabilities: (v: any[]) => void
}) {
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

  const handleAdd = () => {
    if (!name) return
    setLiabilities([
      ...liabilities,
      {
        name,
        total_value: totalValue ? Number(totalValue) : null,
        remaining_balance: remainingBalance
          ? Number(remainingBalance)
          : totalValue
            ? Number(totalValue)
            : 0,
        monthly_installment: monthlyInstallment ? Number(monthlyInstallment) : null,
        due_date:
          !isRecurring && dueDate ? new Date(dueDate + 'T12:00:00.000Z').toISOString() : null,
        start_date: startDate ? new Date(startDate + 'T12:00:00.000Z').toISOString() : null,
        is_recurring: isRecurring,
        monthly_due_day: isRecurring && monthlyDueDay ? Number(monthlyDueDay) : null,
        end_date: hasEndDate && endDate ? new Date(endDate + 'T12:00:00.000Z').toISOString() : null,
      },
    ])
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
  }

  return (
    <div className="space-y-4">
      {liabilities.length > 0 && (
        <div className="space-y-2">
          {liabilities.map((l, i) => (
            <div
              key={l.id || i}
              className="flex items-center justify-between p-2 border rounded-md text-sm bg-muted/10"
            >
              <div>
                <p className="font-medium">{l.name}</p>
                <p className="text-xs text-muted-foreground">
                  {l.remaining_balance
                    ? `Saldo: R$ ${Number(l.remaining_balance).toFixed(2)}`
                    : 'Sem saldo devedor'}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => setLiabilities(liabilities.filter((_, idx) => idx !== i))}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 p-3 border border-dashed rounded-lg bg-muted/5">
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs">Descrição</Label>
          <Input
            className="h-8 text-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Financiamento"
          />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label className="text-xs">Valor Total</Label>
          <Input
            className="h-8 text-xs"
            type="number"
            min="0"
            step="0.01"
            value={totalValue}
            onChange={(e) => setTotalValue(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label className="text-xs">Saldo Devedor</Label>
          <Input
            className="h-8 text-xs"
            type="number"
            min="0"
            step="0.01"
            value={remainingBalance}
            onChange={(e) => setRemainingBalance(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label className="text-xs">Parcela Mensal</Label>
          <Input
            className="h-8 text-xs"
            type="number"
            min="0"
            step="0.01"
            value={monthlyInstallment}
            onChange={(e) => setMonthlyInstallment(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label className="text-xs">Data Início</Label>
          <Input
            className="h-8 text-xs"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="col-span-2 flex items-center justify-between py-1 border-y my-1">
          <Label className="text-xs cursor-pointer" onClick={() => setIsRecurring(!isRecurring)}>
            Despesa Recorrente
          </Label>
          <Switch
            checked={isRecurring}
            onCheckedChange={setIsRecurring}
            className="scale-75 origin-right"
          />
        </div>

        {isRecurring ? (
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Dia de Vencimento Mensal</Label>
            <Input
              className="h-8 text-xs"
              type="number"
              min="1"
              max="31"
              value={monthlyDueDay}
              onChange={(e) => setMonthlyDueDay(e.target.value)}
              placeholder="Ex: 5"
            />
          </div>
        ) : (
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Data de Vencimento</Label>
            <Input
              className="h-8 text-xs"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        )}

        <div className="col-span-2 flex items-center justify-between py-1 border-b mb-1">
          <Label className="text-xs cursor-pointer" onClick={() => setHasEndDate(!hasEndDate)}>
            Tem Data de Término?
          </Label>
          <Switch
            checked={hasEndDate}
            onCheckedChange={setHasEndDate}
            className="scale-75 origin-right"
          />
        </div>

        {hasEndDate && (
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Data de Término</Label>
            <Input
              className="h-8 text-xs"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}

        <div className="col-span-2 mt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={handleAdd}
          >
            <Plus size={14} className="mr-1" /> Adicionar Despesa/Obrigação
          </Button>
        </div>
      </div>
    </div>
  )
}
