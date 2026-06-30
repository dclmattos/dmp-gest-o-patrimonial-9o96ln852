import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency, convertValue, useCurrency } from '@/hooks/use-currency'

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
    return null
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/40 space-y-4">
      {hasReceivables && (
        <div>
          <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 uppercase tracking-wide mb-2">
            <ArrowUpRight size={12} /> Entradas Vinculadas
          </span>
          <div className="space-y-1">
            {receivables.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs py-1">
                <span className="text-muted-foreground truncate mr-2">{r.source}</span>
                <span className="text-emerald-600 font-medium">
                  +{formatCurrency(convertValue(r.amount, 'BRL', currency), currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasLiabilities && (
        <div>
          <span className="text-xs font-medium text-rose-600 flex items-center gap-1 uppercase tracking-wide mb-2">
            <ArrowDownRight size={12} /> Obrigações Vinculadas
          </span>
          <div className="space-y-1">
            {liabilities.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-xs py-1">
                <span className="text-muted-foreground truncate mr-2">{l.name}</span>
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
