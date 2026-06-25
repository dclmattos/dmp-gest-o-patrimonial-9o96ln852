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
import * as Icons from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createAsset } from '@/services/assets'
import { getAssetCategories } from '@/services/asset_categories'
import { useRealtime } from '@/hooks/use-realtime'

export function AssetDialog() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const [categories, setCategories] = useState<any[]>([])

  const [name, setName] = useState('')
  const [type, setType] = useState('property')
  const [subtype, setSubtype] = useState('')
  const [currency, setCurrency] = useState('BRL')
  const [valuation, setValuation] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [categoryId, setCategoryId] = useState('none')

  const loadCategories = async () => {
    try {
      const data = await getAssetCategories()
      setCategories(data)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    if (open) loadCategories()
  }, [open])
  useRealtime('asset_categories', loadCategories, open)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      await createAsset({
        user: user.id,
        name,
        type,
        subtype,
        currency,
        current_valuation: Number(valuation),
        purchase_price: purchasePrice ? Number(purchasePrice) : null,
        category: categoryId === 'none' ? null : categoryId,
      })
      setOpen(false)
      setName('')
      setSubtype('')
      setValuation('')
      setPurchasePrice('')
      setCategoryId('none')
    } catch (err) {
      console.error(err)
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Ativo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
              <Label>Subtipo (Opcional)</Label>
              <Input
                value={subtype}
                onChange={(e) => setSubtype(e.target.value)}
                placeholder="Ex: Ações"
              />
            </div>
            <div className="space-y-2">
              <Label>Valoração Atual</Label>
              <Input
                required
                type="number"
                step="0.01"
                value={valuation}
                onChange={(e) => setValuation(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor de Compra</Label>
              <Input
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria (Opcional)</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
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

          <Button type="submit" className="w-full mt-4">
            Salvar Ativo
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
