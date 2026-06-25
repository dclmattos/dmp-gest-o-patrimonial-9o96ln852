import { useState } from 'react'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { useCurrency } from '@/hooks/use-currency'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download } from 'lucide-react'
import { useEffect } from 'react'
import { CategoryManager } from '@/components/CategoryManager'
import { AssetDialog } from '@/components/AssetDialog'
import { AssetCard } from '@/components/AssetCard'
import { Button } from '@/components/ui/button'
import { getAssetCategories } from '@/services/asset_categories'
import { deleteAsset } from '@/services/assets'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

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
        description: 'Ativo excluído com sucesso',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir ativo',
        variant: 'destructive',
      } as any)
    }
  }

  const filtered = tab === 'all' ? assets : assets.filter((a) => a.type === tab)

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
              <AssetCard
                key={asset.id}
                asset={asset}
                categories={categories}
                onDelete={handleDeleteAsset}
                onUpdate={(updated) => {
                  setLocalAssets((prev) =>
                    prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
                  )
                }}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg bg-card">
                Nenhum ativo encontrado nesta categoria.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
