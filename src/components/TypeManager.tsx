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
import { Trash2, Plus, Settings2, ChevronUp, ChevronDown } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createAssetType, deleteAssetType, getAssetTypes } from '@/services/asset_types'
import { useRealtime } from '@/hooks/use-realtime'

const ICONS_LIST = [
  'Building2',
  'Car',
  'TrendingUp',
  'Globe',
  'Briefcase',
  'Landmark',
  'PiggyBank',
  'Wallet',
  'Bitcoin',
  'LineChart',
  'Gem',
  'Home',
  'Box',
  'CircleDollarSign',
]

export function TypeManager() {
  const [open, setOpen] = useState(false)
  const [types, setTypes] = useState<any[]>([])
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(ICONS_LIST[0])

  const loadTypes = async () => {
    try {
      const data = await getAssetTypes()
      setTypes(data)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    if (open) loadTypes()
  }, [open])
  useRealtime('asset_types', loadTypes, open)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !user) return
    const customTypes = types.filter((t) => !t.is_system)
    const maxSort = customTypes.reduce((max, t) => Math.max(max, t.sort_order || 0), 0)
    try {
      await createAssetType({
        name,
        icon,
        is_system: false,
        sort_order: maxSort + 1,
      })
      setName('')
      setIcon(ICONS_LIST[0])
    } catch (err) {
      console.error(err)
    }
  }

  const moveType = async (id: string, direction: 'up' | 'down') => {
    const customTypes = types.filter((t) => !t.is_system)
    const index = customTypes.findIndex((t) => t.id === id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === customTypes.length - 1) return

    const newOrder = [...customTypes]
    const swapIndex = direction === 'up' ? index - 1 : index + 1

    const temp = newOrder[index]
    newOrder[index] = newOrder[swapIndex]
    newOrder[swapIndex] = temp

    const systemTypes = types.filter((t) => t.is_system)
    setTypes([...systemTypes, ...newOrder])

    const promises = newOrder.map((t, i) => {
      const newSortOrder = i + 1
      if (t.sort_order !== newSortOrder) {
        return updateAssetType(t.id, { sort_order: newSortOrder })
      }
      return Promise.resolve()
    })

    try {
      await Promise.all(promises)
    } catch (err) {
      console.error(err)
      loadTypes()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza? Os ativos associados não serão apagados, mas perderão este tipo.')) {
      try {
        await deleteAssetType(id)
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
          <Settings2 size={16} />
          <span className="hidden sm:inline">Gerenciar Tipos</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Tipos de Ativos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <form
            onSubmit={handleAdd}
            className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border/50"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Tipo</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Criptomoedas"
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
                      const IconComponent = Icons[i as keyof typeof Icons] || Icons.Box
                      return (
                        <SelectItem key={i} value={i}>
                          <div className="flex items-center gap-2">
                            {/* @ts-expect-error */}
                            <IconComponent size={16} />
                            <span>{i}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={!name.trim()}>
              <Plus size={16} />
              Adicionar Tipo
            </Button>
          </form>

          <div className="space-y-3">
            <Label className="text-muted-foreground">Seus Tipos</Label>
            {types.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                Nenhum tipo encontrado.
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                {types.map((t) => {
                  const IconComponent = Icons[t.icon as keyof typeof Icons] || Icons.Box
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted text-muted-foreground">
                          {/* @ts-expect-error */}
                          <IconComponent size={16} />
                        </div>
                        <span className="font-medium">
                          {t.name}
                          {t.is_system && (
                            <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              Sistema
                            </span>
                          )}
                        </span>
                      </div>
                      {!t.is_system && (
                        <div className="flex items-center gap-1">
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-muted-foreground hover:text-foreground"
                              onClick={() => moveType(t.id, 'up')}
                              disabled={
                                types
                                  .filter((x) => !x.is_system)
                                  .findIndex((x) => x.id === t.id) === 0
                              }
                            >
                              <ChevronUp size={12} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-muted-foreground hover:text-foreground"
                              onClick={() => moveType(t.id, 'down')}
                              disabled={
                                types
                                  .filter((x) => !x.is_system)
                                  .findIndex((x) => x.id === t.id) ===
                                types.filter((x) => !x.is_system).length - 1
                              }
                            >
                              <ChevronDown size={12} />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 ml-1"
                            onClick={() => handleDelete(t.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )}
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
