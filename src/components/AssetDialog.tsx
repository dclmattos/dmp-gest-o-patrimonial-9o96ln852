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
import { Plus } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createAsset } from '@/services/assets'
import { getAssetCategories } from '@/services/asset_categories'
import { getAssetTypes } from '@/services/asset_types'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

export function AssetDialog() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const [categories, setCategories] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const [name, setName] = useState('')
  const [typeRef, setTypeRef] = useState('')
  const [subtype, setSubtype] = useState('')
  const [currency, setCurrency] = useState('BRL')
  const [valuation, setValuation] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [acquisitionDate, setAcquisitionDate] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [categoryId, setCategoryId] = useState('none')

  const loadData = async () => {
    try {
      const [cats, ts] = await Promise.all([getAssetCategories(), getAssetTypes()])
      setCategories(cats)
      setTypes(ts)
      if (ts.length > 0 && !typeRef) {
        setTypeRef(ts[0].id)
      }
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    if (open) {
      loadData()
      setName('')
      setTypeRef('')
      setSubtype('')
      setCurrency('BRL')
      setValuation('')
      setPurchasePrice('')
      setAcquisitionDate('')
      setLocation('')
      setNotes('')
      setCategoryId('none')
      setFieldErrors({})
    }
  }, [open])

  useRealtime('asset_categories', loadData, open)
  useRealtime('asset_types', loadData, open)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setFieldErrors({})
    try {
      await createAsset({
        name,
        type_ref: typeRef,
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
      toast({ title: 'Sucesso', description: 'Ativo criado com sucesso.' })
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast({
        title: 'Erro',
        description: 'Falha ao criar ativo. Verifique os campos.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-subtle hover:shadow-elevation transition-all">
          <Plus size={16} />
          Adicionar Ativo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Novo Ativo</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-6">
          <form id="create-asset-form" onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Apartamento Centro"
                className={fieldErrors.name ? 'border-red-500' : ''}
              />
              {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={typeRef} onValueChange={setTypeRef}>
                  <SelectTrigger className={fieldErrors.type_ref ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => {
                      const IconComponent = Icons[t.icon as keyof typeof Icons] || Icons.Box
                      return (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center gap-2">
                            <IconComponent size={14} className="text-muted-foreground" />
                            <span>{t.name}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {fieldErrors.type_ref && (
                  <p className="text-sm text-red-500">{fieldErrors.type_ref}</p>
                )}
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
                <Label>Subtipo (Opcional)</Label>
                <Input
                  value={subtype}
                  onChange={(e) => setSubtype(e.target.value)}
                  placeholder="Ex: Ações"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria (Opcional)</Label>
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
                  placeholder="0.00"
                  className={fieldErrors.current_valuation ? 'border-red-500' : ''}
                />
                {fieldErrors.current_valuation && (
                  <p className="text-sm text-red-500">{fieldErrors.current_valuation}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Valor de Compra</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  className={fieldErrors.purchase_price ? 'border-red-500' : ''}
                />
                {fieldErrors.purchase_price && (
                  <p className="text-sm text-red-500">{fieldErrors.purchase_price}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Aquisição</Label>
                <Input
                  type="date"
                  value={acquisitionDate}
                  onChange={(e) => setAcquisitionDate(e.target.value)}
                  className={fieldErrors.acquisition_date ? 'border-red-500' : ''}
                />
                {fieldErrors.acquisition_date && (
                  <p className="text-sm text-red-500">{fieldErrors.acquisition_date}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Localização</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: São Paulo, SP"
                />
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
          <Button type="submit" form="create-asset-form">
            Salvar Ativo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
