import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency, convertValue, useCurrency } from '@/hooks/use-currency'
import { AddReceivableDialog } from '@/components/AddReceivableDialog'
import { AddLiabilityDialog } from '@/components/AddLiabilityDialog'
import { EditReceivableDialog } from '@/components/EditReceivableDialog'
import { EditLiabilityDialog } from '@/components/EditLiabilityDialog'

export function AssetFinancials({
  assetId,
  receivables,
  liabilities,
}: {
  assetId: string
  receivables: any[]
  liabilities: any[]
}) {
  const { currency } = useCurrency()

  const hasReceivables = receivables.length > 0
  const hasLiabilities = liabilities.length > 0
  const hasAny = hasReceivables || hasLiabilities

  if (!hasAny) {
    return (
      <div className="mt-4 pt-4 border-t border-border/40">
        <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
          <p className="text-sm text-muted-foreground">
            Nenhuma entrada ou obrigação vinculada a este ativo.
          </p>
          <div className="flex gap-2">
            <AddReceivableDialog assetId={assetId} />
            <AddLiabilityDialog assetId={assetId} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/40 space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 uppercase tracking-wide">
            <ArrowUpRight size={12} /> Entradas Vinculadas
          </span>
          <AddReceivableDialog assetId={assetId} />
        </div>
        {hasReceivables ? (
          <div className="space-y-1">
            {receivables.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs py-1 group">
                <span className="text-muted-foreground truncate mr-2">{r.source}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-emerald-600 font-medium">
                    +{formatCurrency(convertValue(r.amount, 'BRL', currency), currency)}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <EditReceivableDialog receivable={r} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/60 italic">Nenhuma entrada vinculada</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-rose-600 flex items-center gap-1 uppercase tracking-wide">
            <ArrowDownRight size={12} /> Obrigações Vinculadas
          </span>
          <AddLiabilityDialog assetId={assetId} />
        </div>
        {hasLiabilities ? (
          <div className="space-y-1">
            {liabilities.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-xs py-1 group">
                <span className="text-muted-foreground truncate mr-2">{l.name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-rose-600 font-medium">
                    -
                    {formatCurrency(
                      convertValue(
                        l.monthly_installment || l.remaining_balance || 0,
                        'BRL',
                        currency,
                      ),
                      currency,
                    )}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <EditLiabilityDialog liability={l} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/60 italic">Nenhuma obrigação vinculada</p>
        )}
      </div>
    </div>
  )
}
