import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, Tags, ChevronDown, Plus } from 'lucide-react'
import * as Icons from 'lucide-react'
import { buildHierarchicalList } from '@/lib/sort-utils'

interface CategoryMultiSelectProps {
  categories: any[]
  selected: string[]
  onChange: (ids: string[]) => void
  onLoadDefaults?: () => Promise<void>
}

export function CategoryMultiSelect({
  categories,
  selected,
  onChange,
  onLoadDefaults,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false)

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const remove = (id: string) => {
    onChange(selected.filter((s) => s !== id))
  }

  const orderedItems = buildHierarchicalList(categories)

  const getParentName = (catId: string): string | null => {
    const cat = categories.find((c) => c.id === catId)
    if (!cat || !cat.parent_id) return null
    const parent = categories.find((c) => c.id === cat.parent_id)
    return parent ? parent.name : null
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            type="button"
            className="w-full justify-between font-normal"
          >
            <span className="flex items-center gap-2 truncate">
              <Tags size={14} className="text-muted-foreground" />
              {selected.length === 0
                ? 'Selecione categorias...'
                : `${selected.length} categoria(s) selecionada(s)`}
            </span>
            <ChevronDown size={14} className="text-muted-foreground shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0"
          align="start"
        >
          <ScrollArea className="max-h-[220px]">
            <div className="p-1">
              {orderedItems.length === 0 ? (
                <div className="px-3 py-6 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma categoria encontrada. Crie uma no Gerenciador de Categorias.
                  </p>
                  {onLoadDefaults && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 mx-auto"
                      onClick={async () => {
                        try {
                          await onLoadDefaults()
                        } catch (e) {
                          console.error(e)
                        }
                      }}
                    >
                      <Plus size={14} />
                      Carregar Categorias Padrão
                    </Button>
                  )}
                </div>
              ) : (
                orderedItems.map(({ category: cat, parentName, depth }) => {
                  const Icon = Icons[cat.icon as keyof typeof Icons] || Icons.Tags
                  const isSelected = selected.includes(cat.id)
                  const displayName = parentName ? `${parentName} › ${cat.name}` : cat.name
                  return (
                    <div
                      key={cat.id}
                      onClick={() => toggle(cat.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-sm hover:bg-accent cursor-pointer transition-colors ${depth > 0 ? 'ml-4' : ''}`}
                    >
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                      <div
                        className="p-1 rounded-full bg-muted shrink-0"
                        style={{ color: cat.color }}
                      >
                        {/* @ts-expect-error */}
                        <Icon size={14} />
                      </div>
                      <span className="text-sm flex-1 truncate">{displayName}</span>
                      {cat.goal_value > 0 && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          Meta:{' '}
                          {cat.goal_value.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((id) => {
            const cat = categories.find((c) => c.id === id)
            if (!cat) return null
            const parentName = getParentName(id)
            const Icon = Icons[cat.icon as keyof typeof Icons] || Icons.Tags
            const displayName = parentName ? `${parentName} › ${cat.name}` : cat.name
            return (
              <Badge
                key={id}
                variant="outline"
                className="flex items-center gap-1.5 pr-1.5 transition-colors hover:bg-accent"
                style={{ color: cat.color, borderColor: cat.color + '40' }}
              >
                {/* @ts-expect-error */}
                <Icon size={12} style={{ color: cat.color }} />
                <span>{displayName}</span>
                <button
                  type="button"
                  onClick={() => remove(id)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/15 transition-colors"
                >
                  <X size={12} />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
