import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import * as Icons from 'lucide-react'
import { formatCurrency, convertValue, useCurrency } from '@/hooks/use-currency'
import { getAssetCategories } from '@/lib/asset-utils'
import { AssetFinancials } from '@/components/AssetFinancials'
import pb from '@/lib/pocketbase/client'
import { TrendingUp, MapPin, Calendar, FileText, Building2 } from 'lucide-react'

export function AssetDetailDialog({
  asset,
  categories,
  types,
  receivables,
  liabilities,
  open,
  onOpenChange,
}: {
  asset: any
  categories: any[]
  types: any[]
  receivables: any[]
  liabilities: any[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { currency } = useCurrency()
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    if (open && asset?.id) {
      pb.collection('valuation_history')
        .getFullList({
          filter: `asset = "${asset.id}"`,
          sort: 'date',
        })
        .then(setHistory)
        .catch(() => setHistory([]))
    }
  }, [open, asset?.id])

  const assetCategories = getAssetCategories(asset, categories)
  const assetType = types?.find((t) => t.id === asset.type_ref)
  const IconComponent =
    assetType?.icon && Icons[assetType.icon as keyof typeof Icons]
      ? Icons[assetType.icon as keyof typeof Icons]
      : Icons.Box

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            {/* @ts-expect-error */}
            <IconComponent size={20} className="text-muted-foreground" />
            {asset.name}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-6">
          <div className="space-y-6 py-4">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {asset.subtype || 'Ativo'}
              </Badge>
              {assetCategories.map((cat) => {
                const Icon = Icons[cat.icon as keyof typeof Icons] || Icons.Tags
                return (
                  <Badge
                    key={cat.id}
                    variant="outline"
                    className="flex items-center gap-1"
                    style={{ color: cat.color }}
                  >
                    {/* @ts-expect-error */}
                    <Icon size={12} style={{ color: cat.color }} />
                    {cat.name}
                  </Badge>
                )
              })}
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                Valoração Atual
              </p>
              <p className="text-3xl font-light tracking-tight text-slate-900 dark:text-slate-100">
                {formatCurrency(
                  convertValue(asset.current_valuation, asset.currency, currency),
                  currency,
                )}
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-border/40">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <TrendingUp size={14} /> Valor de Base de Compra
                </span>
                <span className="font-medium">
                  {formatCurrency(asset.purchase_price || 0, asset.currency)}
                </span>
              </div>
              {asset.acquisition_date && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar size={14} /> Data de Aquisição
                  </span>
                  <span className="font-medium">
                    {new Date(asset.acquisition_date).toLocaleDateString('pt-BR', {
                      timeZone: 'UTC',
                    })}
                  </span>
                </div>
              )}
              {asset.location && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MapPin size={14} /> Localização
                  </span>
                  <span className="font-medium">{asset.location}</span>
                </div>
              )}
              {asset.equity_percentage != null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Building2 size={14} /> Participação Societária
                  </span>
                  <span className="font-medium">{Number(asset.equity_percentage).toFixed(2)}%</span>
                </div>
              )}
              {asset.modality && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Modalidade</span>
                  <span className="font-medium">{asset.modality}</span>
                </div>
              )}
            </div>

            {asset.notes && (
              <div className="pt-4 border-t border-border/40">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                  <FileText size={12} /> Notas
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {asset.notes}
                </p>
              </div>
            )}

            {asset.contract_info && (
              <div className="pt-4 border-t border-border/40">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                  Contratualização
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{asset.contract_info}</p>
              </div>
            )}

            {asset.corporate_details && (
              <div className="pt-4 border-t border-border/40">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                  Detalhes Societários
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {asset.corporate_details}
                </p>
              </div>
            )}

            {history.length > 0 && (
              <div className="pt-4 border-t border-border/40">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                  Histórico de Valoração
                </p>
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(h.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(convertValue(h.value, asset.currency, currency), currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border/40">
              <AssetFinancials
                assetId={asset.id}
                receivables={receivables}
                liabilities={liabilities}
              />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
