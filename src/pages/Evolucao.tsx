import { useEffect, useState } from 'react'
import { getValuationHistory } from '@/services/valuation_history'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency, useCurrency, convertValue } from '@/hooks/use-currency'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

export default function Evolucao() {
  const [data, setData] = useState<any[]>([])
  const { currency } = useCurrency()

  useEffect(() => {
    getValuationHistory().then((hist) => {
      const grouped = hist.reduce((acc: any, curr: any) => {
        const d = new Date(curr.date)
        const month = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' })
        if (!acc[month]) acc[month] = 0
        acc[month] += curr.value
        return acc
      }, {})

      const chartData = Object.entries(grouped).map(([month, val]) => ({
        month,
        value: val as number,
      }))
      setData(chartData)
    })
  }, [])

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-serif tracking-tight">Evolução do Patrimônio</h2>
        <p className="text-muted-foreground mt-1">
          Acompanhe a curva de crescimento consolidada dos seus ativos.
        </p>
      </div>

      <Card className="shadow-elevation border border-border/50">
        <CardHeader className="pb-8">
          <CardTitle className="font-serif text-2xl">
            Crescimento Histórico (Últimos 6 Meses)
          </CardTitle>
          <CardDescription>
            Visão agregada de todas as classes de ativos, ajustada cambialmente.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[500px]">
          <ChartContainer
            config={{ value: { label: 'Patrimônio', color: 'hsl(var(--primary))' } }}
            className="w-full h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `R$ ${(val / 1000000).toFixed(1)}M`}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v: number) =>
                        formatCurrency(convertValue(v, 'BRL', currency), currency)
                      }
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorVal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
