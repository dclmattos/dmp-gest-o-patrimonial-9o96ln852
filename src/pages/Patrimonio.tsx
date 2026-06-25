import { useState } from 'react'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { useCurrency, convertValue, formatCurrency } from '@/hooks/use-currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Car, Download, Globe, TrendingUp, Trash2 } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useEffect } from 'react'
import { CategoryManager } from '@/components/CategoryManager'
import { AssetDialog } from '@/components/AssetDialog'
import { EditAssetDialog } from '@/components/EditAssetDialog'
import { Button } from '@/components/ui/button'
import { getAssetCategories } from '@/services/asset_categories'
import { deleteAsset } from '@/services/assets'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function Patrimonio() {
  const [categories, setCategories] = useState<any[]>([])

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

  const { assets: dashboardAssets } = useDashboardData()
  const [localAssets, setLocalAssets] = useState<any[]>([])

  useEffect(() => {
    setLocalAssets(dashboardAssets || [])
  }, [dashboardAssets])

  useRealtime('assets', (e) => {
    if (e.action === 'update') {
      setLocalAssets((prev) => prev.map((a) => (a.id === e.record.id ? e.record : a)))
    } else if (e.action === 'create') {
      setLocalAssets((prev) => [...prev, e.record])
    } else if (e.action === 'delete') {
      setLocalAssets((prev) => prev.filter((a) => a.id !== e.record.id))
    }
  })

  const assets = localAssets

  const { currency } = useCurrency()
  const [tab, setTab] = useState('all')
  const { toast } = useToast()

  const handleDeleteAsset = async (id: string) => {
    try {
      await deleteAsset(id)
      toast({
        title: 'Sucesso',
        description: 'Asset deleted successfully',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Failed to delete asset',
        variant: 'destructive',
      } as any)
    }
  }

  const filtered = tab === 'all' ? assets : assets.filter((a) => a.type === tab)

  const getIcon = (type: string) => {
    if (type === 'property') return <Building2 size={18} />
    if (type === 'vehicle') return <Car size={18} />
    if (type === 'international') return <Globe size={18} />
    return <TrendingUp size={18} />
  }

  const handleExport = () => {
    const headers = [
      'Nome do Ativo',
      'Tipo',
      'Categoria',
      'Moeda',
      'Valoração Atual',
      'Preço de Compra',
    ]
    const rows = filtered.map((a) => {
      const cat = categories.find((c) => c.id === a.category)
      return [
        `"${a.name}"`,
        `"${a.type}"`,
        `"${cat ? cat.name : ''}"`,
        `"${a.currency}"`,
        a.current_valuation,
        a.purchase_price || 0,
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `ativos_${tab}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif tracking-tight">Cofre de Ativos</h2>
          <p className="text-muted-foreground mt-1">
            Gestão completa dos seus ativos físicos e financeiros.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2 shadow-subtle hover:border-primary/30 transition-all"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Exportar Dados</span>
          </Button>
          <CategoryManager />
          <AssetDialog />
        </div>
      </div>

      <Tabs defaultValue="all" value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="all" className="rounded-md py-2">
            Todos os Ativos
          </TabsTrigger>
          <TabsTrigger value="property" className="rounded-md py-2">
            Imóveis
          </TabsTrigger>
          <TabsTrigger value="vehicle" className="rounded-md py-2">
            Veículos
          </TabsTrigger>
          <TabsTrigger value="investment" className="rounded-md py-2">
            Investimentos BR
          </TabsTrigger>
          <TabsTrigger value="international" className="rounded-md py-2">
            Internacional
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((asset) => (
              <Card
                key={asset.id}
                className="shadow-subtle border border-border/50 hover:border-primary/30 hover:shadow-elevation transition-all duration-500 group overflow-hidden bg-gradient-to-br from-card to-slate-50/50 dark:to-slate-900/50"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {asset.subtype || 'Ativo'}
                      </Badge>
                      {asset.category &&
                        (() => {
                          const cat = categories.find((c) => c.id === asset.category)
                          if (!cat) return null
                          const Icon = Icons[cat.icon as keyof typeof Icons] || Icons.Tags
                          return (
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 border-border/50"
                              style={{ color: cat.color }}
                            >
                              {/* @ts-expect-error */}
                              <Icon size={12} style={{ color: cat.color }} />
                              {cat.name}
                            </Badge>
                          )
                        })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-slate-400 group-hover:text-primary transition-colors p-2 bg-background rounded-full shadow-sm border border-border/50">
                        {getIcon(asset.type)}
                      </div>
                      <EditAssetDialog
                        asset={asset}
                        categories={categories}
                        onUpdate={(updated) => {
                          setLocalAssets((prev) =>
                            prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
                          )
                        }}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-background rounded-full shadow-sm border border-border/50 cursor-pointer">
                            <Trash2 size={18} />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Ativo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {asset.name}? This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAsset(asset.id)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardTitle className="font-serif text-xl line-clamp-1">{asset.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                    Valoração Atual
                  </p>
                  <p className="text-3xl font-light tracking-tight text-slate-900 dark:text-slate-100">
                    {formatCurrency(
                      convertValue(asset.current_valuation, asset.currency, currency),
                      currency,
                    )}
                  </p>

                  <div className="mt-6 pt-4 border-t border-border/40 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Valor de Compra</span>
                      <span className="font-medium">
                        {formatCurrency(asset.purchase_price || 0, asset.currency)}
                      </span>
                    </div>
                    {asset.location && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Localização</span>
                        <span className="font-medium truncate max-w-[150px]">{asset.location}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                Nenhum ativo encontrado nesta categoria.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
