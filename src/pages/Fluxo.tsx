import { useEffect, useState } from 'react'
import { getReceivables } from '@/services/receivables'
import { getLiabilities } from '@/services/liabilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, useCurrency, convertValue } from '@/hooks/use-currency'
import { ArrowDownRight, ArrowUpRight, Calendar as CalendarIcon, Clock } from 'lucide-react'

export default function Fluxo() {
  const [receivables, setReceivables] = useState<any[]>([])
  const [liabilities, setLiabilities] = useState<any[]>([])
  const { currency } = useCurrency()

  useEffect(() => {
    getReceivables().then(setReceivables)
    getLiabilities().then(setLiabilities)
  }, [])

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-serif tracking-tight">Fluxo de Caixa</h2>
        <p className="text-muted-foreground mt-1">Gerenciamento previsível de entradas e saídas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border border-border/50 shadow-elevation bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-emerald-50/50 dark:bg-emerald-950/20 pb-5">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                <ArrowUpRight size={20} />
              </div>
              <CardTitle className="font-serif text-xl">Previsão de Entradas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {receivables.map((r) => (
                <div
                  key={r.id}
                  className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{r.source}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                      <div className="flex items-center gap-1">
                        <Clock size={12} /> {r.frequency}
                      </div>
                    </div>
                  </div>
                  <p className="text-emerald-600 font-medium text-lg">
                    +{formatCurrency(convertValue(r.amount, 'BRL', currency), currency)}
                  </p>
                </div>
              ))}
              {receivables.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum fluxo programado.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-elevation bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-rose-50/50 dark:bg-rose-950/20 pb-5">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-full">
                <ArrowDownRight size={20} />
              </div>
              <CardTitle className="font-serif text-xl">Passivos e Obrigações</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {liabilities.map((l) => (
                <div
                  key={l.id}
                  className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{l.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                      <span>
                        Saldo Restante:{' '}
                        {formatCurrency(
                          convertValue(l.remaining_balance, 'BRL', currency),
                          currency,
                        )}
                      </span>
                    </div>
                  </div>
                  <p className="text-rose-600 font-medium text-lg">
                    -
                    {formatCurrency(convertValue(l.monthly_installment, 'BRL', currency), currency)}
                    <span className="text-sm text-muted-foreground font-normal">/mês</span>
                  </p>
                </div>
              ))}
              {liabilities.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhuma obrigação cadastrada.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
