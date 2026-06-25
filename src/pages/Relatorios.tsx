import { useEffect, useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency, useCurrency, convertValue } from '@/hooks/use-currency'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { getAssetCategories } from '@/services/asset_categories'
import { useRealtime } from '@/hooks/use-realtime'
import { Download, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react'

export default function Relatorios() {
  const { assets, valuationHistory } = useDashboardData()
  const { currency } = useCurrency()

  const [categories, setCategories] = useState<any[]>([])
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 6)
    return d.toISOString().substring(0, 10)
  })

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().substring(0, 10)
  })

  const loadCategories = async () => {
    try {
      const data = await getAssetCategories()
      setCategories(data)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])
  useRealtime('asset_categories', loadCategories)

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchType = selectedType === 'all' || a.type === selectedType
      const matchCategory = selectedCategory === 'all' || a.category === selectedCategory
      return matchType && matchCategory
    })
  }, [assets, selectedType, selectedCategory])

  const getAssetValue = (asset: any, dateStr: string, events: any[]) => {
    let val = 0
    let found = false
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].date.substring(0, 10) <= dateStr) {
        val = events[i].value
        found = true
        break
      }
    }

    const today = new Date().toISOString().substring(0, 10)

    if (!found) {
      if (asset.acquisition_date && asset.acquisition_date.substring(0, 10) <= dateStr) {
        val = asset.purchase_price ?? asset.current_valuation ?? 0
      } else if (!asset.acquisition_date) {
        if (dateStr >= today) {
          val = asset.current_valuation ?? 0
        }
      }
    }

    if (dateStr >= today) {
      val = asset.current_valuation ?? val
    }

    return val
  }

  const reportData = useMemo(() => {
    if (!filteredAssets.length) {
      return {
        startTotalValue: 0,
        endTotalValue: 0,
        difference: 0,
        percentage: 0,
        isPositive: true,
        chartData: [],
        eventsByAsset: new Map(),
      }
    }

    const filteredAssetsIds = new Set(filteredAssets.map((a) => a.id))

    const relevantHistory = (valuationHistory || []).filter(
      (vh) => filteredAssetsIds.has(vh.asset) && vh.date,
    )
    const acquisitions = filteredAssets
      .filter((a) => a.acquisition_date)
      .map((a) => ({
        asset: a.id,
        date: a.acquisition_date,
        value: a.purchase_price ?? 0,
      }))

    const allEvents = [...relevantHistory, ...acquisitions].sort((a, b) =>
      a.date.localeCompare(b.date),
    )

    const eventsByAsset = new Map<string, any[]>()
    allEvents.forEach((e) => {
      if (!eventsByAsset.has(e.asset)) eventsByAsset.set(e.asset, [])
      eventsByAsset.get(e.asset)!.push(e)
    })

    let startTotalValue = 0
    let endTotalValue = 0

    filteredAssets.forEach((a) => {
      const events = eventsByAsset.get(a.id) || []
      startTotalValue += convertValue(getAssetValue(a, startDate, events), a.currency, currency)
      endTotalValue += convertValue(getAssetValue(a, endDate, events), a.currency, currency)
    })

    const difference = endTotalValue - startTotalValue
    const percentage =
      startTotalValue === 0 ? (endTotalValue > 0 ? 100 : 0) : (difference / startTotalValue) * 100
    const isPositive = difference >= 0

    const chartData = []
    let [year, month] = startDate.substring(0, 7).split('-').map(Number)
    const [endYear, endMonthNum] = endDate.substring(0, 7).split('-').map(Number)

    if (year < endYear || (year === endYear && month <= endMonthNum)) {
      while (year < endYear || (year === endYear && month <= endMonthNum)) {
        const m = `${year}-${month.toString().padStart(2, '0')}`
        const dateForMonth = m === endDate.substring(0, 7) ? endDate : `${m}-28`

        let total = 0
        filteredAssets.forEach((a) => {
          total += convertValue(
            getAssetValue(a, dateForMonth, eventsByAsset.get(a.id) || []),
            a.currency,
            currency,
          )
        })
        chartData.push({ date: m, value: total })

        month++
        if (month > 12) {
          month = 1
          year++
        }
      }
    }

    return {
      startTotalValue,
      endTotalValue,
      difference,
      percentage,
      isPositive,
      chartData,
      eventsByAsset,
    }
  }, [filteredAssets, valuationHistory, currency, startDate, endDate])

  const handleExport = () => {
    const { eventsByAsset } = reportData
    const rows = [
      [
        'Ativo',
        'Tipo',
        'Categoria',
        'Moeda',
        'Valor Inicial',
        'Valor Final',
        'Variação',
        'Variação %',
      ],
    ]

    filteredAssets.forEach((a) => {
      const events = eventsByAsset.get(a.id) || []
      const sVal = getAssetValue(a, startDate, events)
      const eVal = getAssetValue(a, endDate, events)
      const sValConv = convertValue(sVal, a.currency, currency)
      const eValConv = convertValue(eVal, a.currency, currency)

      const diff = eValConv - sValConv
      const pct = sValConv === 0 ? (eValConv > 0 ? 100 : 0) : (diff / sValConv) * 100

      const catName = categories.find((c) => c.id === a.category)?.name || 'Sem Categoria'

      rows.push([
        `"${a.name}"`,
        a.type,
        `"${catName}"`,
        currency,
        sValConv.toFixed(2),
        eValConv.toFixed(2),
        diff.toFixed(2),
        pct.toFixed(2),
      ])
    })

    const csvContent = '\uFEFF' + rows.map((e) => e.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_patrimonio_${startDate}_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif tracking-tight">Relatórios de Performance</h2>
          <p className="text-muted-foreground mt-1">
            Análise detalhada de valorização ou desvalorização do seu portfólio.
          </p>
        </div>
        <Button onClick={handleExport} className="bg-primary text-primary-foreground shadow-sm">
          <Download className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <Card className="shadow-subtle border-none bg-slate-50 dark:bg-slate-900">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Ativo</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Ativos</SelectItem>
                  <SelectItem value="property">Imóveis</SelectItem>
                  <SelectItem value="vehicle">Veículos</SelectItem>
                  <SelectItem value="investment">Investimentos BR</SelectItem>
                  <SelectItem value="international">Internacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todas" />
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
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-subtle border-none bg-slate-50 dark:bg-slate-900 flex flex-col justify-center">
          <CardHeader>
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Calendar size={18} />
              <span className="font-medium text-sm uppercase tracking-wider">Valor Inicial</span>
            </div>
            <CardTitle className="text-3xl font-serif text-slate-800 dark:text-slate-100 font-light">
              {formatCurrency(reportData.startTotalValue, currency)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="shadow-subtle border-none bg-slate-50 dark:bg-slate-900 flex flex-col justify-center">
          <CardHeader>
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Wallet size={18} />
              <span className="font-medium text-sm uppercase tracking-wider">Valor Final</span>
            </div>
            <CardTitle className="text-3xl font-serif text-slate-800 dark:text-slate-100 font-light">
              {formatCurrency(reportData.endTotalValue, currency)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="shadow-elevation border-none overflow-hidden relative bg-white dark:bg-slate-950">
          <div
            className={`absolute -right-6 -top-6 opacity-10 ${
              reportData.isPositive ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {reportData.isPositive ? <TrendingUp size={140} /> : <TrendingDown size={140} />}
          </div>
          <CardHeader>
            <CardTitle className="text-slate-500 uppercase tracking-wider text-sm font-medium">
              Variação do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1 relative z-10">
              <span
                className={`text-4xl sm:text-5xl font-serif tracking-tight font-medium ${
                  reportData.isPositive ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {reportData.isPositive ? '+' : ''}
                {reportData.percentage.toFixed(2)}%
              </span>
              <span className="text-lg text-muted-foreground font-medium">
                {reportData.isPositive ? '+' : ''}
                {formatCurrency(reportData.difference, currency)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-elevation border border-border/50">
        <CardHeader className="pb-8">
          <CardTitle className="font-serif text-2xl">Performance no Tempo</CardTitle>
          <CardDescription>
            Flutuação do valor dos ativos selecionados no período de análise.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {reportData.chartData.length > 0 ? (
            <ChartContainer
              config={{ value: { label: 'Valor', color: 'hsl(var(--primary))' } }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={reportData.chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                    tickFormatter={(val) => {
                      try {
                        return format(parseISO(`${val}-01`), 'MMM yy', { locale: ptBR })
                      } catch {
                        return val
                      }
                    }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency,
                        notation: 'compact',
                        compactDisplay: 'short',
                        maximumFractionDigits: 1,
                      }).format(val)
                    }
                  />
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v: number) => formatCurrency(v, currency)}
                        labelFormatter={(label) => {
                          try {
                            return format(parseISO(`${label}-01`), 'MMMM yyyy', {
                              locale: ptBR,
                            })
                          } catch {
                            return label
                          }
                        }}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorVal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center border border-dashed rounded-lg">
              <p className="text-muted-foreground text-sm">Dados insuficientes para o gráfico.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
