import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Car, Globe, TrendingUp, Trash2 } from 'lucide-react'
import * as Icons from 'lucide-react'
import { formatCurrency, convertValue, useCurrency } from '@/hooks/use-currency'
import { EditAssetDialog } from '@/components/EditAssetDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface AssetCardProps {
  asset: any
  categories: any[]
  onDelete: (id: string) => void
  onUpdate?: (updated: any) => void
}

export function AssetCard({ asset, categories, onDelete, onUpdate }: AssetCardProps) {
  const { currency } = useCurrency()

  const getIcon = (type: string) => {
    if (type === 'property') return <Building2 size={18} />
    if (type === 'vehicle') return <Car size={18} />
    if (type === 'international') return <Globe size={18} />
    return <TrendingUp size={18} />
  }

  return (
    <Card className="shadow-subtle border border-border/50 hover:border-primary/30 hover:shadow-elevation transition-all duration-500 group overflow-hidden bg-gradient-to-br from-card to-slate-50/50 dark:to-slate-900/50">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {asset.subtype || 'Ativo'}
            </Badge>
            {asset.category &&
              (() => {
                const cat = categories.find((c) => c.id === asset.category)
                if (!cat) return null
                const Icon = Icons[cat.icon as keyof typeof Icons] || Icons.Tags
                return (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 border-border/50"
                    style={{ color: cat.color }}
                  >
                    {/* @ts-expect-error */}
                    <Icon size={12} style={{ color: cat.color }} />
                    {cat.name}
                  </Badge>
                )
              })()}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-slate-400 group-hover:text-primary transition-colors p-2 bg-background rounded-full shadow-sm border border-border/50">
              {getIcon(asset.type)}
            </div>
            <EditAssetDialog asset={asset} categories={categories} onUpdate={onUpdate} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-background rounded-full shadow-sm border border-border/50 cursor-pointer">
                  <Trash2 size={18} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Ativo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza de que deseja excluir {asset.name}? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(asset.id)}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <CardTitle className="font-serif text-xl line-clamp-1">{asset.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
          Valoração Atual
        </p>
        <p className="text-3xl font-light tracking-tight text-slate-900 dark:text-slate-100">
          {formatCurrency(
            convertValue(asset.current_valuation, asset.currency, currency),
            currency,
          )}
        </p>

        <div className="mt-6 pt-4 border-t border-border/40 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Valor de Base de Compra</span>
            <span className="font-medium">
              {formatCurrency(asset.purchase_price || 0, asset.currency)}
            </span>
          </div>
          {asset.location && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Localização</span>
              <span className="font-medium truncate max-w-[150px]">{asset.location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
