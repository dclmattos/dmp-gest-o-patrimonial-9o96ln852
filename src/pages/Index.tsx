import { useDashboardData } from '@/hooks/use-dashboard-data'
import { useCurrency, convertValue, formatCurrency } from '@/hooks/use-currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ArrowUpRight, Building2, Globe, Wallet } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

import { useState, useEffect } from 'react'
import { getAssetCategories } from '@/services/asset_categories'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Index() {
  const { assets, liabilities, receivables } = useDashboardData()
  const { currency } = useCurrency()
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const loadCategories = async () => {
    try {
      const data = await getAssetCategories()
      setCategories(data)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])
  useRealtime('asset_categories', loadCategories)

  const filteredAssets =
    selectedCategory === 'all' ? assets : assets.filter((a) => a.category === selectedCategory)

  const totalAssets = assets.reduce(
    (sum, a) => sum + convertValue(a.current_valuation, a.currency, currency),
    0,
  )
  const totalFilteredAssets = filteredAssets.reduce(
    (sum, a) => sum + convertValue(a.current_valuation, a.currency, currency),
    0,
  )
  const totalLiabilities = liabilities.reduce(
    (sum, l) => sum + convertValue(l.remaining_balance, 'BRL', currency),
    0,
  )
  const netWorth = selectedCategory === 'all' ? totalAssets - totalLiabilities : totalFilteredAssets

  const allocation = [
    {
      name: 'Imóveis',
      value: filteredAssets
        .filter((a) => a.type === 'property')
        .reduce((s, a) => s + convertValue(a.current_valuation, a.currency, currency), 0),
      color: 'hsl(var(--chart-1))',
    },
    {
      name: 'Veículos',
      value: filteredAssets
        .filter((a) => a.type === 'vehicle')
        .reduce((s, a) => s + convertValue(a.current_valuation, a.currency, currency), 0),
      color: 'hsl(var(--chart-2))',
    },
    {
      name: 'Invest. BR',
      value: filteredAssets
        .filter((a) => a.type === 'investment')
        .reduce((s, a) => s + convertValue(a.current_valuation, a.currency, currency), 0),
      color: 'hsl(var(--chart-3))',
    },
    {
      name: 'Internacional',
      value: filteredAssets
        .filter((a) => a.type === 'international')
        .reduce((s, a) => s + convertValue(a.current_valuation, a.currency, currency), 0),
      color: 'hsl(var(--chart-4))',
    },
  ].filter((x) => x.value > 0)

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif tracking-tight">Visão Geral</h2>
          <p className="text-muted-foreground mt-1">
            Acompanhe e filtre a evolução do seu patrimônio.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[240px] shadow-sm">
              <SelectValue placeholder="Todas as Categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-slate-950 text-slate-50 p-8 sm:p-12 shadow-elevation">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Globe size={300} />
        </div>
        <div className="relative z-10">
          <p className="text-slate-400 font-medium tracking-widest uppercase text-xs mb-3">
            {selectedCategory === 'all' ? 'Patrimônio Líquido Total' : 'Valor da Categoria'}
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
                {formatCurrency(totalFilteredAssets, currency)}
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

      {categories.filter((c) => c.goal_value > 0).length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-serif mb-4">Metas por Categoria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories
              .filter((c) => c.goal_value > 0)
              .map((cat) => {
                const catAssets = assets.filter((a) => a.category === cat.id)
                const current = catAssets.reduce(
                  (sum, a) => sum + convertValue(a.current_valuation, a.currency, currency),
                  0,
                )
                const goal = cat.goal_value
                const progress = Math.min((current / goal) * 100, 100)

                return (
                  <Card key={cat.id} className="shadow-subtle border-none">
                    <CardContent className="p-6 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <div className="font-medium flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          ></span>
                          {cat.name}
                        </div>
                        <div className="text-muted-foreground font-medium">
                          {progress.toFixed(1)}%
                        </div>
                      </div>
                      <Progress value={progress} indicatorColor={cat.color} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(current, currency)}</span>
                        <span>Meta: {formatCurrency(goal, currency)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
