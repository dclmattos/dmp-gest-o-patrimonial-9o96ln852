import { useDashboardData } from '@/hooks/use-dashboard-data'
import { useCurrency, convertValue, formatCurrency } from '@/hooks/use-currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Building2, Wallet } from 'lucide-react'
import { useMemo } from 'react'

export default function MyPortfolio() {
  const { assets, liabilities } = useDashboardData()
  const { currency } = useCurrency()

  const totalAssets = assets.reduce(
    (sum, a) => sum + convertValue(a.current_valuation, a.currency, currency),
    0,
  )
  const totalLiabilities = liabilities.reduce(
    (sum, l) => sum + convertValue(l.remaining_balance, 'BRL', currency),
    0,
  )
  const netWorth = totalAssets - totalLiabilities

  const allocation = useMemo(() => {
    return [
      {
        name: 'Imóveis',
        value: assets
          .filter((a) => a.type === 'property')
          .reduce((s, a) => s + convertValue(a.current_valuation, a.currency, currency), 0),
        color: 'hsl(var(--chart-1))',
      },
      {
        name: 'Veículos',
        value: assets
          .filter((a) => a.type === 'vehicle')
          .reduce((s, a) => s + convertValue(a.current_valuation, a.currency, currency), 0),
        color: 'hsl(var(--chart-2))',
      },
      {
        name: 'Investimentos',
        value: assets
          .filter((a) => a.type === 'investment')
          .reduce((s, a) => s + convertValue(a.current_valuation, a.currency, currency), 0),
        color: 'hsl(var(--chart-3))',
      },
      {
        name: 'Internacional',
        value: assets
          .filter((a) => a.type === 'international')
          .reduce((s, a) => s + convertValue(a.current_valuation, a.currency, currency), 0),
        color: 'hsl(var(--chart-4))',
      },
    ].filter((x) => x.value > 0)
  }, [assets, currency])

  const liabilityTimeline = useMemo(() => {
    if (!liabilities.length) return []
    return liabilities
      .filter((l) => l.due_date || l.end_date)
      .map((l) => ({
        name: l.name,
        date: l.due_date || l.end_date,
        value: convertValue(l.remaining_balance, 'BRL', currency),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [liabilities, currency])

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h2 className="text-3xl font-serif tracking-tight">Meu Portfólio</h2>
        <p className="text-muted-foreground mt-1">
          Visualize seus relatórios personalizados e confidenciais.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-slate-950 text-slate-50 p-8 sm:p-12 shadow-elevation">
        <div className="relative z-10">
          <p className="text-slate-400 font-medium tracking-widest uppercase text-xs mb-3">
            Patrimônio Líquido Total
          </p>
          <div className="flex items-baseline gap-4">
            <h1 className="text-5xl sm:text-7xl font-serif font-medium tracking-tight text-white">
              {formatCurrency(netWorth, currency)}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-subtle border-none">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Alocação de Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            {allocation.length > 0 ? (
              <div className="h-[250px]">
                <ChartContainer config={{}} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocation}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {allocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(val: number) => formatCurrency(val, currency)}
                          />
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center border border-dashed rounded-lg">
                <p className="text-muted-foreground text-sm">Nenhum ativo alocado.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-subtle border-none">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total de Ativos</p>
                  <p className="text-xl font-serif">{formatCurrency(totalAssets, currency)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Passivos Registrados</p>
                  <p className="text-xl font-serif">{formatCurrency(totalLiabilities, currency)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-subtle border-none">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Timeline de Passivos e Obrigações</CardTitle>
          </CardHeader>
          <CardContent>
            {liabilityTimeline.length > 0 ? (
              <div className="space-y-4">
                {liabilityTimeline.map((l, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-card transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">{l.name}</span>
                    <span className="text-destructive font-serif text-lg">
                      {formatCurrency(l.value, currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground border border-dashed rounded-lg">
                Nenhum passivo registrado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
