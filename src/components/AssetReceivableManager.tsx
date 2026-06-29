import { useState } from 'react'
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
import { Plus, Trash2 } from 'lucide-react'
import { sortAlphabetically } from '@/lib/sort-utils'

export function AssetReceivableManager({
  receivables,
  setReceivables,
}: {
  receivables: any[]
  setReceivables: (v: any[]) => void
}) {
  const [source, setSource] = useState('')
  const [amount, setAmount] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [frequency, setFrequency] = useState('one-time')

  const handleAdd = () => {
    if (!source || !amount) return
    const newReceivables = [
      ...receivables,
      {
        source,
        amount: Number(amount),
        expected_date: expectedDate
          ? new Date(expectedDate + 'T12:00:00.000Z').toISOString()
          : null,
        frequency,
      },
    ]
    newReceivables.sort((a, b) =>
      String(a.source ?? '')
        .toLowerCase()
        .localeCompare(String(b.source ?? '').toLowerCase(), 'pt-BR'),
    )
    setReceivables(newReceivables)
    setSource('')
    setAmount('')
    setExpectedDate('')
    setFrequency('one-time')
  }

  return (
    <div className="space-y-4">
      {receivables.length > 0 && (
        <div className="space-y-2">
          {receivables.map((r, i) => (
            <div
              key={r.id || i}
              className="flex items-center justify-between p-2 border rounded-md text-sm bg-muted/10"
            >
              <div>
                <p className="font-medium">{r.source}</p>
                <p className="text-xs text-muted-foreground">
                  R$ {Number(r.amount).toFixed(2)} - {r.frequency}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => setReceivables(receivables.filter((_, idx) => idx !== i))}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 p-3 border border-dashed rounded-lg bg-muted/5">
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label className="text-xs">Origem</Label>
          <Input
            className="h-8 text-xs"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Ex: Aluguel"
          />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label className="text-xs">Valor</Label>
          <Input
            className="h-8 text-xs"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label className="text-xs">Data Prevista</Label>
          <Input
            className="h-8 text-xs"
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label className="text-xs">Frequência</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one-time">Única</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="quarterly">Trimestral</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 mt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={handleAdd}
          >
            <Plus size={14} className="mr-1" /> Adicionar Recebível
          </Button>
        </div>
      </div>
    </div>
  )
}
