import { useAuth } from '@/hooks/use-auth'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { useCurrency, convertValue, formatCurrency } from '@/hooks/use-currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ArrowUpRight, ArrowDownRight, Building2, Globe, Wallet } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { useState, useEffect, useMemo } from 'react'
import { getAssetCategories } from '@/services/asset_categories'
import { deleteAsset } from '@/services/assets'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AssetCard } from '@/components/AssetCard'
import { useToast } from '@/hooks/use-toast'

export default function Index() {
  const { assets, liabilities, receivables, valuationHistory } = useDashboardData()
  const { currency } = useCurrency()
  const [categories, setCategories] = useState<any[]>([])

  const [selectedType, setSelectedType] = useState<string>(
    () => sessionStorage.getItem('dashboard_type') || 'all',
  )
  const [selectedCategory, setSelectedCategory] = useState<string>(
    () => sessionStorage.getItem('dashboard_category') || 'all',
  )
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [systemUsers, setSystemUsers] = useState<any[]>([])

  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      import('@/services/users').then(({ getUsers }) => {
        getUsers().then(setSystemUsers).catch(console.error)
      })
    }
  }, [isAdmin])

  useEffect(() => {
    sessionStorage.setItem('dashboard_type', selectedType)
  }, [selectedType])

  useEffect(() => {
    sessionStorage.setItem('dashboard_category', selectedCategory)
  }, [selectedCategory])

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

  const { toast } = useToast()

  const handleDeleteAsset = async (id: string) => {
    try {
      await deleteAsset(id)
      toast({
        title: 'Sucesso',
        description: 'Ativo excluído com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir ativo.',
        variant: 'destructive',
      })
    }
  }

  const filteredAssets = assets.filter((a) => {
    const matchType = selectedType === 'all' || a.type === selectedType
    const matchCategory = selectedCategory === 'all' || a.category === selectedCategory
    const matchUser = selectedUser === 'all' || a.user === selectedUser
    return matchType && matchCategory && matchUser
  })

  const filteredLiabilities = liabilities.filter(
    (l) => selectedUser === 'all' || l.user === selectedUser,
  )
  const filteredReceivables = receivables.filter(
    (r) => selectedUser === 'all' || r.user === selectedUser,
  )

  const totalAssets = assets.reduce(
    (sum, a) => sum + convertValue(a.current_valuation, a.currency, currency),
    0,
  )
  const totalFilteredAssets = filteredAssets.reduce(
    (sum, a) => sum + convertValue(a.current_valuation, a.currency, currency),
    0,
  )
  const totalLiabilities = filteredLiabilities.reduce(
    (sum, l) => sum + convertValue(l.remaining_balance, 'BRL', currency),
    0,
  )

  const isAllFiltered = selectedCategory === 'all' && selectedType === 'all'
  const netWorth = isAllFiltered ? totalAssets - totalLiabilities : totalFilteredAssets

  const allocation = useMemo(() => {
    if (selectedType === 'all') {
      return [
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
    } else {
      return categories
        .map((c, i) => ({
          name: c.name,
          value: filteredAssets
            .filter((a) => a.category === c.id)
            .reduce((s, a) => s + convertValue(a.current_valuation, a.currency, currency), 0),
          color: c.color || `hsl(var(--chart-${(i % 5) + 1}))`,
        }))
        .concat({
          name: 'Sem Categoria',
          value: filteredAssets
            .filter((a) => !a.category)
            .reduce((s, a) => s + convertValue(a.current_valuation, a.currency, currency), 0),
          color: 'hsl(var(--muted))',
        })
        .filter((x) => x.value > 0)
    }
  }, [filteredAssets, selectedType, categories, currency])

  const evolutionData = useMemo(() => {
    const now = new Date()
    const allMonths: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      allMonths.push(d.toISOString().substring(0, 7))
    }

    if (!filteredAssets.length && !filteredLiabilities.length) {
      return allMonths.map((m) => ({ date: m, value: 0 }))
    }

    const assetCurrencyMap = new Map(filteredAssets.map((a) => [a.id, a.currency]))
    const filteredAssetsIds = new Set(filteredAssets.map((a) => a.id))

    const relevantHistory = (valuationHistory || []).filter(
      (vh) => filteredAssetsIds.has(vh.asset) && vh.date,
    )
    const allEvents = [...relevantHistory].sort((a, b) => a.date.localeCompare(b.date))

    const currentMonthStr = now.toISOString().substring(0, 7)

    const eventsByAsset = new Map<string, Array<{ month: string; value: number }>>()
    allEvents.forEach((e) => {
      const m = e.date.substring(0, 7)
      if (!eventsByAsset.has(e.asset)) eventsByAsset.set(e.asset, [])
      eventsByAsset.get(e.asset)!.push({ month: m, value: e.value })
    })

    const uniquePointsByAsset = new Map<string, Array<{ month: string; value: number }>>()
    filteredAssets.forEach((asset) => {
      const points = []
      const startMonth = asset.acquisition_date
        ? asset.acquisition_date.substring(0, 7)
        : asset.created
          ? asset.created.substring(0, 7)
          : null
      const startPrice = asset.purchase_price ?? asset.current_valuation ?? 0

      if (startMonth) {
        points.push({ month: startMonth, value: startPrice })
      }

      const events = eventsByAsset.get(asset.id) || []
      events.forEach((e) => {
        points.push({ month: e.month, value: e.value })
      })

      points.push({ month: currentMonthStr, value: asset.current_valuation || 0 })
      points.sort((a, b) => a.month.localeCompare(b.month))

      const uniquePoints: Array<{ month: string; value: number }> = []
      for (const p of points) {
        const last = uniquePoints[uniquePoints.length - 1]
        if (last && last.month === p.month) {
          last.value = p.value
        } else {
          uniquePoints.push({ ...p })
        }
      }
      uniquePointsByAsset.set(asset.id, uniquePoints)
    })

    const data = allMonths.map((m) => {
      let totalAssetsValue = 0
      filteredAssets.forEach((asset) => {
        const uniquePoints = uniquePointsByAsset.get(asset.id) || []
        let latestValue = 0

        if (uniquePoints.length === 0 || m < uniquePoints[0].month) {
          latestValue = 0
        } else if (m >= uniquePoints[uniquePoints.length - 1].month) {
          latestValue = uniquePoints[uniquePoints.length - 1].value
        } else {
          for (let i = 0; i < uniquePoints.length - 1; i++) {
            if (uniquePoints[i].month <= m && uniquePoints[i + 1].month > m) {
              const p1 = uniquePoints[i]
              const p2 = uniquePoints[i + 1]
              const [y1, mo1] = p1.month.split('-').map(Number)
              const [y2, mo2] = p2.month.split('-').map(Number)
              const diffMonths = (y2 - y1) * 12 + (mo2 - mo1)
              const [my, mmo] = m.split('-').map(Number)
              const passedMonths = (my - y1) * 12 + (mmo - mo1)
              latestValue = p1.value + (p2.value - p1.value) * (passedMonths / diffMonths)
              break
            }
          }
        }

        totalAssetsValue += convertValue(
          latestValue,
          assetCurrencyMap.get(asset.id) || 'BRL',
          currency,
        )
      })

      let totalLiabilitiesValue = 0
      if (isAllFiltered) {
        filteredLiabilities.forEach((l) => {
          const startDateStr = l.start_date || l.created?.substring(0, 10) || ''
          const startMonth = startDateStr.substring(0, 7)
          if (!startMonth || startMonth <= m) {
            let balance = l.remaining_balance || 0
            if (l.monthly_installment && m < currentMonthStr) {
              const [currY, currM] = currentMonthStr.split('-').map(Number)
              const [mY, mM] = m.split('-').map(Number)
              const diff = (currY - mY) * 12 + (currM - mM)
              balance += l.monthly_installment * diff

              if (l.total_value && balance > l.total_value) {
                balance = l.total_value
              }
            }
            totalLiabilitiesValue += convertValue(balance, 'BRL', currency)
          }
        })
      }

      return {
        date: m,
        value: totalAssetsValue - totalLiabilitiesValue,
      }
    })

    return data
  }, [valuationHistory, filteredAssets, filteredLiabilities, isAllFiltered, currency])

  const monthlyVariation = useMemo(() => {
    if (evolutionData.length < 2) return { percentage: 0, isPositive: true }

    const prevValue = evolutionData[evolutionData.length - 2].value
    const currValue = evolutionData[evolutionData.length - 1].value

    const diff = currValue - prevValue
    const percentage =
      prevValue === 0 ? (currValue > 0 ? 100 : 0) : (diff / Math.abs(prevValue)) * 100

    return {
      percentage,
      isPositive: diff >= 0,
    }
  }, [evolutionData])

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif tracking-tight">Visão Geral</h2>
          <p className="text-muted-foreground mt-1">
            Acompanhe e filtre a evolução do seu patrimônio.
          </p>
        </div>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
          {isAdmin && (
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-full sm:w-[180px] shadow-sm">
                <SelectValue placeholder="Todos os Clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Clientes</SelectItem>
                {systemUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-[180px] shadow-sm">
              <SelectValue placeholder="Tipo de Ativo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Ativos</SelectItem>
              <SelectItem value="property">Imóveis</SelectItem>
              <SelectItem value="vehicle">Veículos</SelectItem>
              <SelectItem value="investment">Investimentos BR</SelectItem>
              <SelectItem value="international">Internacional</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px] shadow-sm">
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
            {isAllFiltered ? 'Patrimônio Líquido Total' : 'Valor Filtrado'}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-4">
            <h1 className="text-5xl sm:text-7xl font-serif font-medium tracking-tight text-white">
              {formatCurrency(netWorth, currency)}
            </h1>
            <div
              className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium w-fit ${
                monthlyVariation.isPositive
                  ? 'text-emerald-400 bg-emerald-400/10'
                  : 'text-rose-400 bg-rose-400/10'
              }`}
            >
              {monthlyVariation.isPositive ? (
                <ArrowUpRight size={16} className="mr-1" />
              ) : (
                <ArrowDownRight size={16} className="mr-1" />
              )}
              {monthlyVariation.isPositive ? '+' : ''}
              {monthlyVariation.percentage.toFixed(1)}% no mês
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
            {allocation.length > 0 ? (
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
            ) : (
              <div className="h-[250px] flex items-center justify-center border border-dashed rounded-lg">
                <p className="text-muted-foreground text-sm">Nenhum ativo encontrado.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
          <Card className="shadow-subtle border-none flex flex-col justify-center bg-slate-50 dark:bg-slate-900 text-center items-center py-2">
            <CardHeader className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Building2 size={18} />
                <span className="font-medium text-sm uppercase tracking-wider">
                  Total de Ativos
                </span>
              </div>
              <CardTitle className="text-4xl sm:text-5xl font-serif text-slate-800 dark:text-slate-100 font-light">
                {formatCurrency(totalFilteredAssets, currency)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-subtle border-none flex-1">
            <CardHeader>
              <CardTitle className="font-serif text-xl">
                {isAllFiltered
                  ? 'Evolução do Patrimônio Líquido (6 Meses)'
                  : 'Evolução Filtrada (6 Meses)'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evolutionData.length > 0 ? (
                <div className="h-[250px] w-full">
                  <ChartContainer
                    config={{
                      value: { label: 'Valor', color: 'hsl(var(--primary))' },
                    }}
                    className="h-full w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={evolutionData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--muted-foreground)/0.2)"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          tickFormatter={(val) => {
                            try {
                              return format(parseISO(`${val}-01`), 'MMM yy', { locale: ptBR })
                            } catch {
                              return val
                            }
                          }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
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
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(val: number) => formatCurrency(val, currency)}
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
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorValue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              ) : (
                <div className="h-[250px] w-full flex items-center justify-center border border-dashed rounded-lg">
                  <p className="text-muted-foreground text-sm">
                    Dados não disponíveis para o filtro atual.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-subtle border-none bg-rose-50 dark:bg-rose-950/20 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-400 uppercase tracking-widest flex items-center gap-2">
              <Wallet size={16} />
              Passivos & Obrigações
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-900/50 shadow-sm flex flex-col justify-center flex-1">
              <p className="text-sm text-muted-foreground mb-1">Saldo Devedor Total</p>
              <p className="font-medium font-serif text-rose-600 dark:text-rose-400 text-2xl">
                {formatCurrency(totalLiabilities, currency)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-subtle border-none bg-emerald-50 dark:bg-emerald-950/20 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">
              Próximos Recebimentos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {filteredReceivables.slice(0, 2).map((r) => (
                <div
                  key={r.id}
                  className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm flex flex-col justify-center h-full"
                >
                  <p className="text-sm text-muted-foreground truncate mb-1">{r.source}</p>
                  <p className="font-medium text-emerald-600 text-2xl">
                    {formatCurrency(convertValue(r.amount, 'BRL', currency), currency)}
                  </p>
                </div>
              ))}
              {filteredReceivables.length === 0 && (
                <div className="bg-white/50 dark:bg-slate-900/50 px-4 py-3 rounded-xl border border-dashed border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center col-span-full h-full min-h-[84px]">
                  <p className="text-sm text-muted-foreground">Nenhum fluxo programado.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {categories.filter((c) => c.goal_value > 0).length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-serif mb-4">Metas por Categoria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories
              .filter((c) => c.goal_value > 0)
              .map((cat) => {
                const catAssets = filteredAssets.filter((a) => a.category === cat.id)
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

      <div className="mt-8">
        <h3 className="text-xl font-serif mb-4">Ativos Filtrados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              categories={categories}
              onDelete={handleDeleteAsset}
            />
          ))}
          {filteredAssets.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg bg-card">
              Nenhum ativo encontrado para o filtro selecionado.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
