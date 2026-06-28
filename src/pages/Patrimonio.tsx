import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { useCurrency } from '@/hooks/use-currency'
import { useAuth } from '@/hooks/use-auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Users } from 'lucide-react'
import { CategoryManager } from '@/components/CategoryManager'
import { TypeManager } from '@/components/TypeManager'
import { AssetDialog } from '@/components/AssetDialog'
import { AssetCard } from '@/components/AssetCard'
import { Button } from '@/components/ui/button'
import { getAssetCategories } from '@/services/asset_categories'
import { getAssetTypes } from '@/services/asset_types'
import { deleteAsset } from '@/services/assets'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { getUsers } from '@/services/users'
import { setSelectedUserId } from '@/stores/selectedUser'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Patrimonio() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<string>(isAdmin ? '' : user?.id)

  useEffect(() => {
    if (isAdmin) {
      getUsers().then((data) =>
        setClients(data.filter((u) => u.role === 'user' || u.id === user?.id)),
      )
    }
  }, [isAdmin, user?.id])

  useEffect(() => {
    if (selectedClient) {
      setSelectedUserId(selectedClient)
    } else {
      setSelectedUserId(null)
    }
    return () => setSelectedUserId(null)
  }, [selectedClient])

  const [categories, setCategories] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])

  const loadData = async () => {
    if (isAdmin && !selectedClient) return
    const effectiveUserId = selectedClient || (user?.role === 'user' ? user?.id : undefined)
    try {
      const [cats, ts] = await Promise.all([
        getAssetCategories(effectiveUserId),
        getAssetTypes(effectiveUserId),
      ])
      setCategories(cats)
      setTypes(ts)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedClient, isAdmin, user])

  useRealtime('asset_categories', loadData)
  useRealtime('asset_types', loadData)

  const queryUserId = isAdmin && !selectedClient ? 'skip' : selectedClient || undefined
  const { assets, receivables, liabilities } = useDashboardData(queryUserId)
  const [localAssets, setLocalAssets] = useState<Record<string, any>>({})

  useEffect(() => {
    setLocalAssets({})
  }, [assets])

  const handleUpdateAsset = (updated: any) => {
    setLocalAssets((prev) => ({ ...prev, [updated.id]: updated }))
  }

  const allAssets = assets.map((a) => localAssets[a.id] ?? a)

  const { currency } = useCurrency()
  const [tab, setTab] = useState('all')
  const { toast } = useToast()
  const location = useLocation()
  const highlightAsset = location.state?.highlightAsset as string | undefined

  useEffect(() => {
    if (highlightAsset && assets.length > 0) {
      const asset = assets.find((a) => a.id === highlightAsset)
      if (asset && asset.type_ref !== tab) {
        setTab(asset.type_ref)
      }
      setTimeout(() => {
        const el = document.getElementById(`asset-${highlightAsset}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 200)
    }
  }, [highlightAsset, assets, tab])

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

  const filtered = tab === 'all' ? allAssets : allAssets.filter((a) => a.type_ref === tab)

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
      const t = types.find((t) => t.id === a.type_ref)
      return [
        `"${a.name}"`,
        `"${t ? t.name : a.type || ''}"`,
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

  if (isAdmin && !selectedClient) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <h2 className="text-3xl font-serif tracking-tight">Cofre de Ativos</h2>
            <p className="text-muted-foreground mt-1">
              Gestão de ativos dos clientes. Selecione um cliente para visualizar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Selecione um cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name || c.email} {c.id === user?.id && '(Você)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-lg border-dashed bg-card/50">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium mb-2">Nenhum cliente selecionado</h3>
          <p className="text-muted-foreground max-w-md">
            Utilize o seletor acima para escolher um cliente e gerenciar o seu cofre de ativos
            patrimoniais.
          </p>
        </div>
      </div>
    )
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
          {isAdmin && (
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Trocar cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name || c.email} {c.id === user?.id && '(Você)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2 shadow-subtle hover:border-primary/30 transition-all"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Exportar Dados</span>
          </Button>
          <TypeManager />
          <CategoryManager />
          <AssetDialog />
        </div>
      </div>

      <Tabs defaultValue="all" value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="all" className="rounded-md py-2">
            Todos os Ativos
          </TabsTrigger>
          {types.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="rounded-md py-2">
              {t.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((asset) => (
              <div
                key={asset.id}
                id={`asset-${asset.id}`}
                className={
                  highlightAsset === asset.id
                    ? 'ring-2 ring-primary rounded-lg transition-all duration-1000'
                    : ''
                }
              >
                <AssetCard
                  asset={asset}
                  categories={categories}
                  types={types}
                  receivables={receivables}
                  liabilities={liabilities}
                  onDelete={handleDeleteAsset}
                  onUpdate={handleUpdateAsset}
                />
              </div>
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
