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
import { Plus } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createReceivable } from '@/services/receivables'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export function AddReceivableDialog({ assetId }: { assetId?: string }) {
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

  const [source, setSource] = useState('')
  const [amount, setAmount] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [frequency, setFrequency] = useState('one-time')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const targetUserId = assetId ? assetUserId : user.id
    if (assetId && !targetUserId) return
    try {
      await createReceivable({
        user: targetUserId,
        source,
        amount: Number(amount),
        expected_date: expectedDate
          ? new Date(expectedDate + 'T12:00:00.000Z').toISOString()
          : null,
        frequency,
        ...(assetId ? { asset: assetId } : {}),
      })
      toast({ title: 'Sucesso', description: 'Entrada adicionada com sucesso.' })
      setOpen(false)
      setSource('')
      setAmount('')
      setExpectedDate('')
      setFrequency('one-time')
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao adicionar entrada.',
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
          className="gap-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950 border-emerald-200 dark:border-emerald-900"
        >
          <Plus size={14} /> Nova Entrada
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Previsão de Entrada</DialogTitle>
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
            </div>
            <div className="space-y-2">
              <Label>Data Prevista</Label>
              <Input
                required
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
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
          </div>
          <Button type="submit" className="w-full">
            Salvar Entrada
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
