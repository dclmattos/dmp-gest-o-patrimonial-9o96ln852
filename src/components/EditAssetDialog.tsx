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
import { Pencil, ChevronDown } from 'lucide-react'
import * as Icons from 'lucide-react'
import { updateAsset } from '@/services/assets'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AssetReceivableManager } from './AssetReceivableManager'
import { AssetLiabilityManager } from './AssetLiabilityManager'
import { createReceivable, deleteReceivable } from '@/services/receivables'
import { createLiability, deleteLiability } from '@/services/liabilities'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

export function EditAssetDialog({
  asset,
  categories,
  types,
  onUpdate,
}: {
  asset: any
  categories: any[]
  types: any[]
  onUpdate?: (asset: any) => void
}) {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const [initialReceivables, setInitialReceivables] = useState<any[]>([])
  const [initialLiabilities, setInitialLiabilities] = useState<any[]>([])
  const [receivables, setReceivables] = useState<any[]>([])
  const [liabilities, setLiabilities] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const [name, setName] = useState(asset.name)
  const [typeRef, setTypeRef] = useState(asset.type_ref || '')
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
      setTypeRef(asset.type_ref || '')
      setSubtype(asset.subtype || '')
      setCurrency(asset.currency)
      setValuation(asset.current_valuation.toString())
      setPurchasePrice(asset.purchase_price ? asset.purchase_price.toString() : '')
      setAcquisitionDate(asset.acquisition_date ? asset.acquisition_date.substring(0, 10) : '')
      setLocation(asset.location || '')
      setNotes(asset.notes || '')
      setCategoryId(asset.category || 'none')

      const fetchLinked = async () => {
        try {
          const [recs, liabs] = await Promise.all([
            pb.collection('receivables').getFullList({ filter: `asset="${asset.id}"` }),
            pb.collection('liabilities').getFullList({ filter: `asset="${asset.id}"` }),
          ])
          setInitialReceivables(recs)
          setReceivables(recs)
          setInitialLiabilities(liabs)
          setLiabilities(liabs)
        } catch (e) {
          console.error(e)
        }
      }
      fetchLinked()
    }
  }, [open, asset])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setFieldErrors({})
    setIsSaving(true)
    try {
      const dataToUpdate = {
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
      }

      if (onUpdate) {
        onUpdate({ ...asset, ...dataToUpdate })
      }

      await updateAsset(asset.id, dataToUpdate)

      const deletedRecs = initialReceivables.filter(
        (ir) => !receivables.find((r) => r.id === ir.id),
      )
      const newRecs = receivables.filter((r) => !r.id)
      for (const r of deletedRecs) await deleteReceivable(r.id)
      for (const r of newRecs) await createReceivable({ ...r, asset: asset.id, user: user.id })

      const deletedLiabs = initialLiabilities.filter(
        (il) => !liabilities.find((l) => l.id === il.id),
      )
      const newLiabs = liabilities.filter((l) => !l.id)
      for (const l of deletedLiabs) await deleteLiability(l.id)
      for (const l of newLiabs) await createLiability({ ...l, asset: asset.id, user: user.id })

      if (onUpdate) {
        onUpdate({ ...asset, ...dataToUpdate })
      }
      setOpen(false)
      toast({ title: 'Sucesso', description: 'Ativo atualizado com sucesso.' })
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      if (onUpdate) {
        onUpdate(asset) // Revert optimistic update
      }
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar ativo. Verifique os campos.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
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

            <Collapsible className="border rounded-md p-3 space-y-2 bg-background">
              <CollapsibleTrigger className="flex items-center justify-between w-full font-medium text-sm hover:text-primary transition-colors [&[data-state=open]>svg]:rotate-180">
                Recebíveis Associados
                <ChevronDown
                  size={16}
                  className="text-muted-foreground transition-transform duration-200"
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pt-3">
                  <AssetReceivableManager
                    receivables={receivables}
                    setReceivables={setReceivables}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible className="border rounded-md p-3 space-y-2 bg-background">
              <CollapsibleTrigger className="flex items-center justify-between w-full font-medium text-sm hover:text-primary transition-colors [&[data-state=open]>svg]:rotate-180">
                Despesas/Obrigações Associadas
                <ChevronDown
                  size={16}
                  className="text-muted-foreground transition-transform duration-200"
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pt-3">
                  <AssetLiabilityManager
                    liabilities={liabilities}
                    setLiabilities={setLiabilities}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </form>
        </ScrollArea>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/40">
          <Button
            variant="outline"
            type="button"
            onClick={() => setOpen(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button type="submit" form={`edit-asset-form-${asset.id}`} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
