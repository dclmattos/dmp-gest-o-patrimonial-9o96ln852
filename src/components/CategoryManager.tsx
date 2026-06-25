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
import { Trash2, Tags, Plus } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import {
  createAssetCategory,
  deleteAssetCategory,
  getAssetCategories,
} from '@/services/asset_categories'
import { useRealtime } from '@/hooks/use-realtime'

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
      await createAssetCategory({ user: user.id, name, color, icon })
      setName('')
      setColor(COLORS[0])
      setIcon(ICONS_LIST[0])
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 shadow-subtle hover:border-primary/30 transition-all"
        >
          <Tags size={16} />
          <span className="hidden sm:inline">Gerenciar Categorias</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <form
            onSubmit={handleAdd}
            className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border/50"
          >
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Nome da Categoria</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Renda Fixa"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
            </div>
            <Button type="submit" className="w-full gap-2" disabled={!name.trim()}>
              <Plus size={16} />
              Adicionar Categoria
            </Button>
          </form>

          <div className="space-y-3">
            <Label className="text-muted-foreground">Suas Categorias</Label>
            {categories.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                Nenhuma categoria criada ainda.
                <br />
                Adicione a sua primeira categoria acima!
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                {categories.map((cat) => {
                  const Icon = Icons[cat.icon as keyof typeof Icons] || Icons.Tags
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted" style={{ color: cat.color }}>
                          {/* @ts-expect-error */}
                          <Icon size={16} />
                        </div>
                        <span className="font-medium">{cat.name}</span>
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
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
