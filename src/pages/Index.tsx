import { useDashboardData } from '@/hooks/use-dashboard-data'
import { useCurrency, convertValue, formatCurrency } from '@/hooks/use-currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ArrowUpRight, Building2, Globe, Wallet } from 'lucide-react'

export default function Index() {
  const { assets, liabilities, receivables } = useDashboardData()
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

  const allocation = [
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
      name: 'Invest. BR',
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

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 text-slate-50 p-8 sm:p-12 shadow-elevation">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Globe size={300} />
        </div>
        <div className="relative z-10">
          <p className="text-slate-400 font-medium tracking-widest uppercase text-xs mb-3">
            Patrimônio Líquido Total
          </p>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-4">
            <h1 className="text-5xl sm:text-7xl font-serif font-medium tracking-tight text-white">
              {formatCurrency(netWorth, currency)}
            </h1>
            <div className="flex items-center text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-md text-sm font-medium w-fit">
              <ArrowUpRight size={16} className="mr-1" />
              +2.4% no mês
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 shadow-subtle border-none">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Alocação Global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ChartContainer
                config={{
                  property: { label: 'Imóveis', color: 'hsl(var(--chart-1))' },
                  vehicle: { label: 'Veículos', color: 'hsl(var(--chart-2))' },
                  investment: { label: 'Investimentos', color: 'hsl(var(--chart-3))' },
                  international: { label: 'Internacional', color: 'hsl(var(--chart-4))' },
                }}
                className="h-full w-full"
              >
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
          </CardContent>
        </Card>

        <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="shadow-subtle border-none flex flex-col justify-center bg-slate-50 dark:bg-slate-900">
            <CardHeader>
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Building2 size={18} />
                <span className="font-medium text-sm uppercase tracking-wider">
                  Total de Ativos
                </span>
              </div>
              <CardTitle className="text-4xl font-serif text-slate-800 dark:text-slate-100 font-light">
                {formatCurrency(totalAssets, currency)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-subtle border-none flex flex-col justify-center bg-slate-50 dark:bg-slate-900">
            <CardHeader>
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Wallet size={18} />
                <span className="font-medium text-sm uppercase tracking-wider">
                  Passivos & Obrigações
                </span>
              </div>
              <CardTitle className="text-4xl font-serif text-slate-800 dark:text-slate-100 font-light">
                {formatCurrency(totalLiabilities, currency)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="sm:col-span-2 shadow-subtle border-none bg-emerald-50 dark:bg-emerald-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">
                Próximos Recebimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {receivables.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm"
                  >
                    <p className="text-sm text-muted-foreground truncate mb-1">{r.source}</p>
                    <p className="font-medium text-emerald-600 text-lg">
                      {formatCurrency(convertValue(r.amount, 'BRL', currency), currency)}
                    </p>
                  </div>
                ))}
                {receivables.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum fluxo programado.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
