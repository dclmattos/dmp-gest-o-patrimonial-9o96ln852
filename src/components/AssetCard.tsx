import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, X } from 'lucide-react'
import * as Icons from 'lucide-react'
import { formatCurrency, convertValue, useCurrency } from '@/hooks/use-currency'
import { EditAssetDialog } from '@/components/EditAssetDialog'
import { AssetOwnerSelect } from '@/components/AssetOwnerSelect'
import { AssetFinancials } from '@/components/AssetFinancials'
import { AssetDetailDialog } from '@/components/AssetDetailDialog'
import { getAssetCategories, getAssetCategoryIds } from '@/lib/asset-utils'
import { updateAsset } from '@/services/assets'
import { useToast } from '@/hooks/use-toast'
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
  types: any[]
  receivables?: any[]
  liabilities?: any[]
  onDelete: (id: string) => void
  onUpdate?: (updated: any) => void
  readOnly?: boolean
}

export function AssetCard({
  asset,
  categories = [],
  types = [],
  receivables = [],
  liabilities = [],
  onDelete,
  onUpdate,
  readOnly = false,
}: AssetCardProps) {
  const { currency } = useCurrency()
  const { toast } = useToast()
  const [detailOpen, setDetailOpen] = useState(false)
  const [removingCategoryId, setRemovingCategoryId] = useState<string | null>(null)

  const assetReceivables = receivables.filter((r) => r.asset === asset.id)
  const assetLiabilities = liabilities.filter((l) => l.asset === asset.id)

  const assetCategories = getAssetCategories(asset, categories)

  const totalReceivables = assetReceivables.reduce(
    (acc, r) => acc + convertValue(r.amount, 'BRL', currency),
    0,
  )
  const totalLiabilities = assetLiabilities.reduce(
    (acc, l) =>
      acc + convertValue(l.remaining_balance || l.monthly_installment || 0, 'BRL', currency),
    0,
  )
  const netProfitability = totalReceivables - totalLiabilities

  const assetType = types?.find((t) => t.id === asset.type_ref)
  const IconComponent =
    assetType && assetType.icon && Icons[assetType.icon as keyof typeof Icons]
      ? Icons[assetType.icon as keyof typeof Icons]
      : Icons.Box

  const handleRemoveCategory = async (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setRemovingCategoryId(categoryId)
    try {
      const currentIds = getAssetCategoryIds(asset)
      const newIds = currentIds.filter((id) => id !== categoryId)
      const updatedAsset = await updateAsset(asset.id, {
        category: newIds.length > 0 ? newIds : [],
      })
      if (onUpdate) {
        onUpdate(updatedAsset)
      }
      toast({
        title: 'Categoria removida',
        description: 'A categoria foi removida do ativo com sucesso.',
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao remover categoria do ativo.',
        variant: 'destructive',
      })
    } finally {
      setRemovingCategoryId(null)
    }
  }

  return (
    <>
      <Card
        className={`shadow-subtle border border-border/50 hover:border-primary/30 hover:shadow-elevation transition-all duration-500 group overflow-hidden bg-gradient-to-br from-card to-slate-50/50 dark:to-slate-900/50 ${readOnly ? 'cursor-pointer' : ''}`}
        onClick={readOnly ? () => setDetailOpen(true) : undefined}
      >
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {asset.subtype || 'Ativo'}
              </Badge>
              {assetCategories.map((cat) => {
                const Icon = Icons[cat.icon as keyof typeof Icons] || Icons.Tags
                return (
                  <Badge
                    key={cat.id}
                    variant="outline"
                    className="flex items-center gap-1.5 pr-1 border-border/50 transition-all duration-300 hover:scale-105 group/category"
                    style={{
                      color: cat.color,
                      borderColor: `${cat.color}40`,
                      backgroundColor: `${cat.color}10`,
                    }}
                  >
                    {/* @ts-expect-error */}
                    <Icon size={12} style={{ color: cat.color }} />
                    <span>{cat.name}</span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveCategory(cat.id, e)}
                        disabled={removingCategoryId === cat.id}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/15 transition-colors disabled:opacity-50 disabled:cursor-wait"
                        title="Remover categoria"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </Badge>
                )
              })}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-slate-400 group-hover:text-primary transition-colors p-2 bg-background rounded-full shadow-sm border border-border/50">
                {/* @ts-expect-error */}
                <IconComponent size={18} />
              </div>
              {!readOnly && (
                <>
                  <EditAssetDialog
                    asset={asset}
                    categories={categories}
                    types={types}
                    onUpdate={onUpdate}
                  />
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
                          Tem certeza de que deseja excluir {asset.name}? Esta ação não pode ser
                          desfeita.
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
                </>
              )}
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
            {!readOnly && <AssetOwnerSelect asset={asset} onUpdate={onUpdate} />}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Valor de Base de Compra</span>
              <span className="font-medium">
                {formatCurrency(asset.purchase_price || 0, asset.currency)}
              </span>
            </div>
            {asset.acquisition_date && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Data de Aquisição</span>
                <span className="font-medium">
                  {new Date(asset.acquisition_date).toLocaleDateString('pt-BR', {
                    timeZone: 'UTC',
                  })}
                </span>
              </div>
            )}
            {asset.location && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Localização</span>
                <span className="font-medium truncate max-w-[150px]">{asset.location}</span>
              </div>
            )}
            {asset.equity_percentage != null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Participação Societária</span>
                <span className="font-medium">{Number(asset.equity_percentage).toFixed(2)}%</span>
              </div>
            )}
            {asset.modality && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Modalidade</span>
                <span className="font-medium">{asset.modality}</span>
              </div>
            )}
            {(assetReceivables.length > 0 || assetLiabilities.length > 0) && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                <span className="text-muted-foreground">Rentabilidade Líquida</span>
                <span
                  className={`font-medium ${netProfitability >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {netProfitability >= 0 ? '+' : ''}
                  {formatCurrency(netProfitability, currency)}
                </span>
              </div>
            )}
          </div>
          <AssetFinancials
            assetId={asset.id}
            receivables={assetReceivables}
            liabilities={assetLiabilities}
          />
        </CardContent>
      </Card>
      {readOnly && (
        <AssetDetailDialog
          asset={asset}
          categories={categories}
          types={types}
          receivables={assetReceivables}
          liabilities={assetLiabilities}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}
    </>
  )
}
