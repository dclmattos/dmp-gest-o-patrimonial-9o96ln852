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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Pencil } from 'lucide-react'
import * as Icons from 'lucide-react'
import { updateAsset } from '@/services/assets'
import { useToast } from '@/hooks/use-toast'

export function EditAssetDialog({ asset, categories }: { asset: any; categories: any[] }) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const [name, setName] = useState(asset.name)
  const [type, setType] = useState(asset.type)
  const [subtype, setSubtype] = useState(asset.subtype || '')
  const [currency, setCurrency] = useState(asset.currency)
  const [valuation, setValuation] = useState(asset.current_valuation.toString())
  const [purchasePrice, setPurchasePrice] = useState(
    asset.purchase_price ? asset.purchase_price.toString() : '',
  )
  const [acquisitionDate, setAcquisitionDate] = useState(
    asset.acquisition_date ? asset.acquisition_date.substring(0, 10) : '',
  )
  const [location, setLocation] = useState(asset.location || '')
  const [notes, setNotes] = useState(asset.notes || '')
  const [categoryId, setCategoryId] = useState(asset.category || 'none')

  useEffect(() => {
    if (open) {
      setName(asset.name)
      setType(asset.type)
      setSubtype(asset.subtype || '')
      setCurrency(asset.currency)
      setValuation(asset.current_valuation.toString())
      setPurchasePrice(asset.purchase_price ? asset.purchase_price.toString() : '')
      setAcquisitionDate(asset.acquisition_date ? asset.acquisition_date.substring(0, 10) : '')
      setLocation(asset.location || '')
      setNotes(asset.notes || '')
      setCategoryId(asset.category || 'none')
    }
  }, [open, asset])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateAsset(asset.id, {
        name,
        type,
        subtype,
        currency,
        current_valuation: Number(valuation),
        purchase_price: purchasePrice ? Number(purchasePrice) : null,
        acquisition_date: acquisitionDate || null,
        location,
        notes,
        category: categoryId === 'none' ? null : categoryId,
      })
      setOpen(false)
      toast({ title: 'Sucesso', description: 'Ativo atualizado com sucesso.' })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar ativo. Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="text-slate-400 hover:text-primary transition-colors p-2 bg-background rounded-full shadow-sm border border-border/50 cursor-pointer"
          title="Editar Ativo"
        >
          <Pencil size={18} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Editar Ativo</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-6">
          <form
            id={`edit-asset-form-${asset.id}`}
            onSubmit={handleSubmit}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Apartamento Centro"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="property">Imóvel</SelectItem>
                    <SelectItem value="vehicle">Veículo</SelectItem>
                    <SelectItem value="investment">Investimento BR</SelectItem>
                    <SelectItem value="international">Internacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Moeda</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">BRL</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subtipo</Label>
                <Input
                  value={subtype}
                  onChange={(e) => setSubtype(e.target.value)}
                  placeholder="Ex: Ações"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {categories.map((cat) => {
                      const Icon = Icons[cat.icon as keyof typeof Icons] || Icons.Tags
                      return (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            {/* @ts-expect-error */}
                            <Icon size={14} style={{ color: cat.color }} />
                            <span>{cat.name}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valoração Atual</Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  value={valuation}
                  onChange={(e) => setValuation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor de Compra</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Aquisição</Label>
                <Input
                  type="date"
                  value={acquisitionDate}
                  onChange={(e) => setAcquisitionDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Localização</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informações adicionais..."
              />
            </div>
          </form>
        </ScrollArea>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/40">
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" form={`edit-asset-form-${asset.id}`}>
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
