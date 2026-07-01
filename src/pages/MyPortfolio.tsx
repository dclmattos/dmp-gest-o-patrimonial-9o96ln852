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
      {
        name: 'Participações Societárias',
        value: assets
          .filter((a) => a.type === 'equity')
          .reduce((s, a) => s + convertValue(a.current_valuation, a.currency, currency), 0),
        color: 'hsl(var(--chart-5))',
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
        <h2 className="text-2xl font-serif font-light tracking-widest uppercase text-neutral-200">
          Meu Portfólio
        </h2>
        <p className="text-[0.65rem] font-sans font-light tracking-[0.2em] uppercase text-neutral-500 mt-2">
          Relatórios estratégicos confidenciais
        </p>
      </div>

      <div className="relative overflow-hidden border border-neutral-900 bg-[#020202] text-white p-8 sm:p-12">
        <div className="relative z-10 flex flex-col items-center text-center">
          <p className="text-primary/70 font-light tracking-[0.3em] uppercase text-[0.65rem] mb-6">
            Patrimônio Líquido Total
          </p>
          <h1 className="text-5xl sm:text-7xl font-serif font-light tracking-wider text-white">
            {formatCurrency(netWorth, currency)}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-neutral-900 bg-[#020202] rounded-none">
          <CardHeader>
            <CardTitle className="font-serif text-xl font-light tracking-wide text-neutral-200">
              Alocação de Ativos
            </CardTitle>
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

        <Card className="border border-neutral-900 bg-[#020202] rounded-none">
          <CardHeader>
            <CardTitle className="font-serif text-xl font-light tracking-wide text-neutral-200">
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-6 border border-neutral-800 bg-[#050505] rounded-none">
              <div>
                <p className="text-[0.65rem] text-neutral-500 uppercase tracking-[0.2em] font-light mb-2">
                  Total de Ativos
                </p>
                <p className="text-2xl font-serif font-light text-white">
                  {formatCurrency(totalAssets, currency)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border border-neutral-800 bg-[#050505] rounded-none">
              <div>
                <p className="text-[0.65rem] text-neutral-500 uppercase tracking-[0.2em] font-light mb-2">
                  Passivos Registrados
                </p>
                <p className="text-2xl font-serif font-light text-white">
                  {formatCurrency(totalLiabilities, currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border border-neutral-900 bg-[#020202] rounded-none">
          <CardHeader>
            <CardTitle className="font-serif text-xl font-light tracking-wide text-neutral-200">
              Cronograma de Obrigações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {liabilityTimeline.length > 0 ? (
              <div className="space-y-4">
                {liabilityTimeline.map((l, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-4 border border-neutral-800 rounded-none bg-[#050505]"
                  >
                    <span className="font-light text-neutral-300 tracking-wide text-sm">
                      {l.name}
                    </span>
                    <span className="text-white font-serif text-lg font-light">
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
