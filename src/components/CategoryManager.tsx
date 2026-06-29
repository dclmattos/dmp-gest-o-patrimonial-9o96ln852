import { useState, useEffect, useRef } from 'react'
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
import { Trash2, Tags, Plus, RefreshCw, GripVertical } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import {
  createAssetCategory,
  deleteAssetCategory,
  getAssetCategories,
  updateAssetCategory,
} from '@/services/asset_categories'
import { useRealtime } from '@/hooks/use-realtime'
import { sortAlphabetically } from '@/lib/sort-utils'

const COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
]
const ICONS_LIST = [
  'Home',
  'Car',
  'Briefcase',
  'DollarSign',
  'Landmark',
  'Plane',
  'Ship',
  'Bitcoin',
  'Gem',
  'Building',
  'Wallet',
  'PiggyBank',
  'LineChart',
]

export function CategoryManager() {
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [icon, setIcon] = useState(ICONS_LIST[0])
  const [goalValue, setGoalValue] = useState('')
  const [parentId, setParentId] = useState<string>('none')

  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !user) return
    try {
      const goal = parseFloat(goalValue)
      const maxSortOrder =
        categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order || 0)) : 0
      await createAssetCategory({
        user: user.id,
        name,
        color,
        icon,
        goal_value: !isNaN(goal) && goal > 0 ? goal : 0,
        sort_order: maxSortOrder + 1,
        parent_id: parentId === 'none' ? null : parentId,
      })
      setName('')
      setColor(COLORS[0])
      setIcon(ICONS_LIST[0])
      setGoalValue('')
      setParentId('none')
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (
      confirm(
        'Tem certeza? Os ativos associados não serão apagados, apenas perderão esta categoria.',
      )
    ) {
      try {
        await deleteAssetCategory(id)
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleSort = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    if (dragItem.current === dragOverItem.current) return

    const newCats = [...categories]
    const draggedItemContent = newCats.splice(dragItem.current, 1)[0]
    newCats.splice(dragOverItem.current, 0, draggedItemContent)

    // Update sort_order locally
    const updatedCats = newCats.map((c, i) => ({ ...c, sort_order: i + 1 }))
    setCategories(updatedCats)

    dragItem.current = null
    dragOverItem.current = null

    // Update in DB
    try {
      await Promise.all(
        updatedCats.map((c) => updateAssetCategory(c.id, { sort_order: c.sort_order })),
      )
    } catch (e) {
      console.error(e)
      loadCategories()
    }
  }

  const handleResetOrder = async () => {
    const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name))
    const updatedCats = sorted.map((c, i) => ({ ...c, sort_order: i + 1 }))
    setCategories(updatedCats)
    try {
      await Promise.all(
        updatedCats.map((c) => updateAssetCategory(c.id, { sort_order: c.sort_order })),
      )
    } catch (e) {
      console.error(e)
      loadCategories()
    }
  }

  const renderCategory = (cat: any, index: number, depth: number = 0) => {
    const Icon = Icons[cat.icon as keyof typeof Icons] || Icons.Tags
    const children = sortAlphabetically(
      categories.filter((c) => c.parent_id === cat.id),
      'name',
    )

    return (
      <div key={cat.id} className="space-y-2">
        <div
          draggable
          onDragStart={(e) => (dragItem.current = categories.findIndex((c) => c.id === cat.id))}
          onDragEnter={(e) => (dragOverItem.current = categories.findIndex((c) => c.id === cat.id))}
          onDragEnd={handleSort}
          onDragOver={(e) => e.preventDefault()}
          className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-card cursor-move group"
          style={{ marginLeft: `${depth * 1.5}rem` }}
        >
          <div className="flex items-center gap-3">
            <GripVertical
              className="text-muted-foreground opacity-50 group-hover:opacity-100"
              size={16}
            />
            <div className="p-2 rounded-full bg-muted shrink-0" style={{ color: cat.color }}>
              {/* @ts-expect-error */}
              <Icon size={16} />
            </div>
            <span className="font-medium flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              {cat.name}
              {cat.goal_value > 0 && (
                <span className="text-xs text-muted-foreground">
                  Meta:{' '}
                  {cat.goal_value.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              )}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => handleDelete(cat.id)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
        {children.map((child, i) => renderCategory(child, i, depth + 1))}
      </div>
    )
  }

  const rootCategories = sortAlphabetically(
    categories.filter((c) => !c.parent_id),
    'name',
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 shadow-subtle hover:border-primary/30 transition-all"
        >
          <Tags size={16} />
          <span className="hidden sm:inline">Categorias</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias e Setores</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <form
            onSubmit={handleAdd}
            className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border/50"
          >
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Renda Fixa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Setor / Categoria Pai</Label>
                  <Select value={parentId} onValueChange={setParentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum (Raiz)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (Raiz)</SelectItem>
                      {sortAlphabetically(
                        categories.filter((c) => !c.parent_id),
                        'name',
                      ).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meta de Valor (Opcional)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={goalValue}
                    onChange={(e) => setGoalValue(e.target.value)}
                    placeholder="Ex: 500000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICONS_LIST.map((i) => {
                        const Icon = Icons[i as keyof typeof Icons] || Icons.Tags
                        return (
                          <SelectItem key={i} value={i}>
                            <div className="flex items-center gap-2">
                              {/* @ts-expect-error */}
                              <Icon size={16} />
                              <span>{i}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.slice(0, 10).map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-foreground' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={!name.trim()}>
              <Plus size={16} />
              Adicionar
            </Button>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">
                Suas Categorias (Arraste para ordenar)
              </Label>
              {categories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetOrder}
                  className="h-8 px-2 text-xs"
                >
                  <RefreshCw size={14} className="mr-1" />
                  Resetar Ordem
                </Button>
              )}
            </div>
            {categories.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                Nenhuma categoria criada ainda.
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 pb-2">
                {rootCategories.map((cat, i) => renderCategory(cat, i))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
