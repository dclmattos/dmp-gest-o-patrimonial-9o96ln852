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
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { getAssetCategories } from '@/services/asset_categories'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { getUsers } from '@/services/users'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function Evolucao() {
  const { user } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [openClient, setOpenClient] = useState(false)

  const actualClient = selectedClient ?? user?.id ?? 'all'

  const { assets, valuationHistory } = useDashboardData(actualClient)
  const { currency } = useCurrency()

  const [categories, setCategories] = useState<any[]>([])
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 5)
    return d.toISOString().substring(0, 10)
  })

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().substring(0, 10)
  })

  useEffect(() => {
    if (user?.role === 'admin') {
      getUsers().then(setUsers).catch(console.error)
    }
  }, [user])

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

  const evolutionData = useMemo(() => {
    if (!filteredAssets.length) return []

    const assetCurrencyMap = new Map(filteredAssets.map((a) => [a.id, a.currency]))
    const filteredAssetsIds = new Set(filteredAssets.map((a) => a.id))

    const relevantHistory = (valuationHistory || []).filter(
      (vh) => filteredAssetsIds.has(vh.asset) && vh.date,
    )
    const allEvents = [...relevantHistory].sort((a, b) => a.date.localeCompare(b.date))

    const currentMonthStr = new Date().toISOString().substring(0, 7)

    const firstMonth = startDate.substring(0, 7) || currentMonthStr
    const endMonthStr = endDate.substring(0, 7) || currentMonthStr

    const allMonths = []
    let [year, month] = firstMonth.split('-').map(Number)
    const [endYear, endMonthNum] = endMonthStr.split('-').map(Number)

    if (year > endYear || (year === endYear && month > endMonthNum)) {
      return []
    }

    while (year < endYear || (year === endYear && month <= endMonthNum)) {
      allMonths.push(`${year}-${month.toString().padStart(2, '0')}`)
      month++
      if (month > 12) {
        month = 1
        year++
      }
    }

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
      let totalValue = 0
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

        totalValue += convertValue(latestValue, assetCurrencyMap.get(asset.id) || 'BRL', currency)
      })
      return { date: m, value: totalValue }
    })

    return data
  }, [valuationHistory, filteredAssets, currency, startDate, endDate])

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif tracking-tight">Evolução do Patrimônio</h2>
          <p className="text-muted-foreground mt-1">
            Analise a curva de crescimento do seu portfólio aplicando filtros customizados.
          </p>
        </div>
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
                <Popover open={openClient} onOpenChange={setOpenClient}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openClient}
                      className="w-full justify-between bg-background font-normal border-input"
                    >
                      <span className="truncate">
                        {actualClient === 'all'
                          ? 'Todos os Clientes'
                          : users.find((u) => u.id === actualClient)?.name ||
                            users.find((u) => u.id === actualClient)?.email ||
                            'Cliente não encontrado'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0"
                    align="start"
                    style={{ width: 'var(--radix-popover-trigger-width)' }}
                  >
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." />
                      <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            keywords={['todos', 'all']}
                            onSelect={() => {
                              setSelectedClient('all')
                              setOpenClient(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                actualClient === 'all' ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            Todos os Clientes
                          </CommandItem>
                          {users.map((u) => (
                            <CommandItem
                              key={u.id}
                              value={u.id}
                              keywords={[u.name || '', u.email || '']}
                              onSelect={() => {
                                setSelectedClient(u.id)
                                setOpenClient(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  actualClient === u.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              {u.name || u.email}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
        </CardContent>
      </Card>

      <Card className="shadow-elevation border border-border/50">
        <CardHeader className="pb-8">
          <CardTitle className="font-serif text-2xl">Gráfico de Crescimento Histórico</CardTitle>
          <CardDescription>
            Visão consolidada dos ativos filtrados para o período selecionado.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[500px]">
          {evolutionData.length > 0 ? (
            <ChartContainer
              config={{ value: { label: 'Patrimônio', color: 'hsl(var(--primary))' } }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            <div className="w-full h-full flex flex-col items-center justify-center border border-dashed rounded-lg text-muted-foreground gap-2">
              <p>Nenhum dado disponível</p>
              <p className="text-sm">
                Ajuste os filtros de período ou categoria para ver resultados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
