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
import { Plus, ChevronDown } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AssetReceivableManager } from './AssetReceivableManager'
import { AssetLiabilityManager } from './AssetLiabilityManager'
import { CategoryMultiSelect } from './CategoryMultiSelect'
import { createReceivable } from '@/services/receivables'
import { createLiability } from '@/services/liabilities'
import { createAsset } from '@/services/assets'
import { getAssetCategories, seedDefaultCategories } from '@/services/asset_categories'
import { getAssetTypes } from '@/services/asset_types'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { getSelectedUserId } from '@/stores/selectedUser'

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
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [equityPercentage, setEquityPercentage] = useState('')
  const [modality, setModality] = useState('')
  const [contractInfo, setContractInfo] = useState('')
  const [corporateDetails, setCorporateDetails] = useState('')
  const [receivables, setReceivables] = useState<any[]>([])
  const [liabilities, setLiabilities] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const loadData = async () => {
    try {
      const selectedUser = getSelectedUserId()
      const [cats, ts] = await Promise.all([
        getAssetCategories(selectedUser || undefined),
        getAssetTypes(selectedUser || undefined),
      ])
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
      setCategoryIds([])
      setEquityPercentage('')
      setModality('')
      setContractInfo('')
      setCorporateDetails('')
      setReceivables([])
      setLiabilities([])
      setFieldErrors({})
    }
  }, [open])

  useRealtime('asset_categories', loadData, open)
  useRealtime('asset_types', loadData, open)

  const selectedType = types.find((t) => t.id === typeRef)
  const isEquityType = selectedType?.name === 'Participações Societárias'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setFieldErrors({})
    setIsSaving(true)
    try {
      const asset = await createAsset({
        name,
        type_ref: typeRef,
        ...(isEquityType ? { type: 'equity' } : {}),
        subtype,
        currency,
        current_valuation: Number(valuation),
        purchase_price: purchasePrice ? Number(purchasePrice) : null,
        acquisition_date: acquisitionDate || null,
        location,
        notes,
        category: categoryIds.length > 0 ? categoryIds : [],
        equity_percentage: isEquityType && equityPercentage ? Number(equityPercentage) : null,
        modality: isEquityType ? modality : null,
        contract_info: isEquityType ? contractInfo : null,
        corporate_details: isEquityType ? corporateDetails : null,
      })

      for (const r of receivables) {
        await createReceivable({ ...r, asset: asset.id, user: user.id })
      }
      for (const l of liabilities) {
        await createLiability({ ...l, asset: asset.id, user: user.id })
      }

      setOpen(false)
      toast({ title: 'Sucesso', description: 'Ativo criado com sucesso.' })
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast({
        title: 'Erro',
        description: 'Falha ao criar ativo. Verifique os campos.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
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
                <CategoryMultiSelect
                  categories={categories}
                  selected={categoryIds}
                  onChange={setCategoryIds}
                  onLoadDefaults={async () => {
                    const selectedUser = getSelectedUserId()
                    if (selectedUser) {
                      await seedDefaultCategories(selectedUser)
                      loadData()
                    }
                  }}
                />
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

            {isEquityType && (
              <div className="space-y-4 border rounded-md p-4 bg-primary/5">
                <p className="text-sm font-medium text-primary">Detalhes Societários</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Percentual de Participação (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={equityPercentage}
                      onChange={(e) => setEquityPercentage(e.target.value)}
                      placeholder="Ex: 25.00"
                      className={fieldErrors.equity_percentage ? 'border-red-500' : ''}
                    />
                    {fieldErrors.equity_percentage && (
                      <p className="text-sm text-red-500">{fieldErrors.equity_percentage}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Modalidade</Label>
                    <Select value={modality} onValueChange={setModality}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LTDA">LTDA</SelectItem>
                        <SelectItem value="S/A">S/A</SelectItem>
                        <SelectItem value="SCP">SCP</SelectItem>
                        <SelectItem value="EIRELI">EIRELI</SelectItem>
                        <SelectItem value="SLU">SLU</SelectItem>
                        <SelectItem value="MEI">MEI</SelectItem>
                        <SelectItem value="EI">EI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Contratualização</Label>
                  <Input
                    value={contractInfo}
                    onChange={(e) => setContractInfo(e.target.value)}
                    placeholder="Ex: Contrato social registrado, em fase de alteração..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Detalhes Societários</Label>
                  <Textarea
                    value={corporateDetails}
                    onChange={(e) => setCorporateDetails(e.target.value)}
                    placeholder="Informações sobre contrato social, quotas, cláusulas especiais..."
                  />
                </div>
              </div>
            )}

            <Collapsible className="border rounded-md p-3 space-y-2 bg-background">
              <CollapsibleTrigger className="flex items-center justify-between w-full font-medium text-sm hover:text-primary transition-colors [&[data-state=open]>svg]:rotate-180">
                Entradas Vinculadas
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
                Obrigações Vinculadas
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
          <Button type="submit" form="create-asset-form" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar Ativo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
