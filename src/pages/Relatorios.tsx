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
import { getUsers } from '@/services/users'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { Download, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react'

export default function Relatorios() {
  const { user } = useAuth()
  const [users, setUsers] = useState<any[]>([])

  const [selectedClient, setSelectedClient] = useState<string>(user?.id || '')

  const { assets } = useDashboardData(selectedClient)
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

  const dateError = useMemo(() => {
    if (startDate && endDate && startDate > endDate) {
      return 'A data de início não pode ser maior que a data de fim.'
    }
    return null
  }, [startDate, endDate])

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

  useEffect(() => {
    if (user?.role === 'admin') {
      getUsers()
        .then((data) => {
          setUsers(data)
          if (data.length > 0 && selectedClient === user.id) {
            const firstUser = data.find((u) => u.role === 'user') || data[0]
            if (firstUser) setSelectedClient(firstUser.id)
          }
        })
        .catch(() => {})
    }
  }, [user, selectedClient])

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchType = selectedType === 'all' || a.type === selectedType
      const matchCategory = selectedCategory === 'all' || a.category === selectedCategory
      return matchType && matchCategory
    })
  }, [assets, selectedType, selectedCategory])

  const getInterpolatedValue = (asset: any, dateStr: string) => {
    if (!dateStr) return 0
    const t = new Date(`${dateStr}T00:00:00Z`).getTime()
    const t_now = new Date(`${new Date().toISOString().substring(0, 10)}T00:00:00Z`).getTime()

    if (!asset.acquisition_date) {
      if (t >= t_now) return asset.current_valuation ?? 0
      return asset.current_valuation ?? 0
    }

    const t_start = new Date(`${asset.acquisition_date.substring(0, 10)}T00:00:00Z`).getTime()

    if (t < t_start) return 0
    if (t >= t_now) return asset.current_valuation ?? 0
    if (t_start >= t_now) return asset.purchase_price ?? asset.current_valuation ?? 0

    const purchasePrice = asset.purchase_price ?? 0
    const currentValuation = asset.current_valuation ?? 0

    return purchasePrice + (currentValuation - purchasePrice) * ((t - t_start) / (t_now - t_start))
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
      }
    }

    let startTotalValue = 0
    let endTotalValue = 0

    filteredAssets.forEach((a) => {
      startTotalValue += convertValue(getInterpolatedValue(a, startDate), a.currency, currency)
      endTotalValue += convertValue(getInterpolatedValue(a, endDate), a.currency, currency)
    })

    const difference = endTotalValue - startTotalValue
    const percentage =
      startTotalValue === 0 ? (endTotalValue > 0 ? 100 : 0) : (difference / startTotalValue) * 100
    const isPositive = difference >= 0

    const chartData: any[] = []

    let chartStart = startDate
    let chartEnd = endDate

    if (!chartStart) {
      const d = new Date()
      d.setMonth(d.getMonth() - 6)
      chartStart = d.toISOString().substring(0, 10)
    }
    if (!chartEnd) {
      chartEnd = new Date().toISOString().substring(0, 10)
    }

    if (chartStart <= chartEnd && chartStart.length >= 10 && chartEnd.length >= 10) {
      const datesToSample = new Set<string>()
      datesToSample.add(chartStart)

      let [year, month] = chartStart.substring(0, 7).split('-').map(Number)
      const [endYear, endMonthNum] = chartEnd.substring(0, 7).split('-').map(Number)

      if (year && month && endYear && endMonthNum) {
        month++
        if (month > 12) {
          month = 1
          year++
        }

        while (year < endYear || (year === endYear && month <= endMonthNum)) {
          const m = `${year}-${month.toString().padStart(2, '0')}`
          const isEndMonth = year === endYear && month === endMonthNum

          if (!isEndMonth) {
            datesToSample.add(`${m}-28`)
          }
          month++
          if (month > 12) {
            month = 1
            year++
          }
        }
      }

      if (chartStart !== chartEnd) {
        datesToSample.add(chartEnd)
      }

      filteredAssets.forEach((a) => {
        if (a.acquisition_date) {
          const acqDate = a.acquisition_date.substring(0, 10)
          if (acqDate >= chartStart && acqDate <= chartEnd) {
            datesToSample.add(acqDate)
          }
        }
      })

      const sortedDates = Array.from(datesToSample).sort()

      for (const d of sortedDates) {
        let total = 0
        filteredAssets.forEach((a) => {
          total += convertValue(getInterpolatedValue(a, d), a.currency, currency)
        })
        chartData.push({ fullDate: d, value: total })
      }
    }

    return {
      startTotalValue,
      endTotalValue,
      difference,
      percentage,
      isPositive,
      chartData,
    }
  }, [filteredAssets, currency, startDate, endDate])

  const handleExport = () => {
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
      const sVal = getInterpolatedValue(a, startDate)
      const eVal = getInterpolatedValue(a, endDate)
      const sValConv = convertValue(sVal, a.currency, currency)
      const eValConv = convertValue(eVal, a.currency, currency)

      const diff = eValConv - sValConv
      const pct = sValConv === 0 ? (eValConv > 0 ? 100 : 0) : (diff / sValConv) * 100

      const catName = categories.find((c) => c.id === a.category)?.name || 'Sem Categoria'

      rows.push([
        `"${a.name || ''}"`,
        a.type || '',
        `"${catName}"`,
        currency || '',
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
    link.setAttribute(
      'download',
      `relatorio_patrimonio_${startDate || 'inicio'}_${endDate || 'fim'}.csv`,
    )
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
          <div
            className={cn(
              'grid grid-cols-1 sm:grid-cols-2 gap-4',
              user?.role === 'admin' ? 'lg:grid-cols-5' : 'lg:grid-cols-4',
            )}
          >
            {user?.role === 'admin' && (
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email || `Cliente ${u.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
          {dateError && <p className="text-sm font-medium text-destructive mt-4">{dateError}</p>}
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
                    dataKey="fullDate"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                    tickFormatter={(val) => {
                      try {
                        return format(parseISO(val), 'MMM yy', { locale: ptBR })
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
                            return format(parseISO(label), "dd 'de' MMMM yyyy", {
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
            <div className="w-full h-full flex flex-col items-center justify-center border border-dashed rounded-lg p-6 text-center">
              <p className="text-muted-foreground text-sm font-medium">
                Nenhum dado encontrado para este cliente.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ajuste os filtros de data, tipo ou categoria, ou adicione ativos para visualizar o
                relatório.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
