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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pencil } from 'lucide-react'
import { updateReceivable } from '@/services/receivables'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

export function EditReceivableDialog({ receivable }: { receivable: any }) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const [source, setSource] = useState(receivable.source)
  const [amount, setAmount] = useState(receivable.amount.toString())
  const [expectedDate, setExpectedDate] = useState(
    receivable.expected_date ? receivable.expected_date.substring(0, 10) : '',
  )
  const [frequency, setFrequency] = useState(receivable.frequency || 'one-time')

  useEffect(() => {
    if (open) {
      setSource(receivable.source)
      setAmount(receivable.amount.toString())
      setExpectedDate(receivable.expected_date ? receivable.expected_date.substring(0, 10) : '')
      setFrequency(receivable.frequency || 'one-time')
      setFieldErrors({})
    }
  }, [open, receivable])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    try {
      await updateReceivable(receivable.id, {
        source,
        amount: Number(amount),
        expected_date: expectedDate
          ? new Date(expectedDate + 'T12:00:00.000Z').toISOString()
          : null,
        frequency,
      })
      toast({ title: 'Sucesso', description: 'Entrada atualizada com sucesso.' })
      setOpen(false)
    } catch (err: any) {
      setFieldErrors(extractFieldErrors(err))
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar entrada. Verifique os campos.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="text-slate-400 hover:text-emerald-600 transition-colors p-2 bg-background rounded-full shadow-sm border border-border/50 cursor-pointer"
          title="Editar Entrada"
        >
          <Pencil size={14} />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Entrada</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Origem</Label>
            <Input
              required
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Ex: Salário"
            />
            {fieldErrors.source && <p className="text-sm text-red-500">{fieldErrors.source}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor</Label>
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
            </div>
            <div className="space-y-2">
              <Label>Data Prevista</Label>
              <Input
                required
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
              {fieldErrors.expected_date && (
                <p className="text-sm text-red-500">{fieldErrors.expected_date}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Frequência</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">Única</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.frequency && (
              <p className="text-sm text-red-500">{fieldErrors.frequency}</p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Salvar Alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
