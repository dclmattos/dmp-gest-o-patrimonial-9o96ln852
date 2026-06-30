import { useEffect, useState } from 'react'
import { getReceivables } from '@/services/receivables'
import { getLiabilities } from '@/services/liabilities'
import { getAssets } from '@/services/assets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, useCurrency, convertValue } from '@/hooks/use-currency'
import { ArrowDownRight, ArrowUpRight, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { AddReceivableDialog } from '@/components/AddReceivableDialog'
import { AddLiabilityDialog } from '@/components/AddLiabilityDialog'
import { EditReceivableDialog } from '@/components/EditReceivableDialog'
import { EditLiabilityDialog } from '@/components/EditLiabilityDialog'
import { Trash2 } from 'lucide-react'
import { deleteReceivable, updateReceivable } from '@/services/receivables'
import { deleteLiability, updateLiability } from '@/services/liabilities'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { getUsers } from '@/services/users'
import { setSelectedUserId } from '@/stores/selectedUser'
import { getFlowOverrides } from '@/services/flow-overrides'
import { MonthlyProjection } from '@/components/MonthlyProjection'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const FREQUENCY_LABELS: Record<string, string> = {
  'one-time': 'Única',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
}

export default function Fluxo() {
  const { user } = useAuth()
  const [receivables, setReceivables] = useState<any[]>([])
  const [liabilities, setLiabilities] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [overrides, setOverrides] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [selectedAsset, setSelectedAsset] = useState<string>('all')
  const { currency } = useCurrency()
  const { toast } = useToast()
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'receivable' | 'liability'
    id: string
    name: string
  } | null>(null)

  useEffect(() => {
    if (user?.role === 'admin') {
      getUsers()
        .then(setUsers)
        .catch(() => {})
    }
  }, [user?.role])

  useEffect(() => {
    setSelectedUserId(selectedClient === 'all' ? null : selectedClient)
  }, [selectedClient])

  const loadData = () => {
    const filterUserId = selectedClient !== 'all' ? selectedClient : undefined
    getReceivables(filterUserId).then(setReceivables)
    getLiabilities(filterUserId).then(setLiabilities)
    getAssets(filterUserId).then(setAssets)
    getFlowOverrides(filterUserId).then(setOverrides)
  }

  useEffect(() => {
    loadData()
  }, [selectedClient])

  useRealtime('receivables', loadData)
  useRealtime('liabilities', loadData)
  useRealtime('assets', loadData)
  useRealtime('flow_overrides', loadData)

  const handleDelete = async () => {
    if (!itemToDelete) return
    try {
      if (itemToDelete.type === 'receivable') {
        await deleteReceivable(itemToDelete.id)
        toast({ title: 'Sucesso', description: 'Entrada removida com sucesso.' })
      } else {
        await deleteLiability(itemToDelete.id)
        toast({ title: 'Sucesso', description: 'Obrigação removida com sucesso.' })
      }
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao remover item.',
        variant: 'destructive',
      })
    } finally {
      setItemToDelete(null)
    }
  }

  const filteredReceivables =
    selectedAsset === 'all' ? receivables : receivables.filter((r) => r.asset === selectedAsset)
  const filteredLiabilities =
    selectedAsset === 'all' ? liabilities : liabilities.filter((l) => l.asset === selectedAsset)

  const handleReorder = async (
    type: 'receivable' | 'liability',
    draggedId: string,
    targetId: string,
  ) => {
    const filteredList = type === 'receivable' ? filteredReceivables : filteredLiabilities

    const draggedIndex = filteredList.findIndex((i) => i.id === draggedId)
    const targetIndex = filteredList.findIndex((i) => i.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return

    const list = type === 'receivable' ? [...receivables] : [...liabilities]
    const itemToMove = list.find((i) => i.id === draggedId)
    if (!itemToMove) return

    const newFilteredList = [...filteredList]
    const [dragged] = newFilteredList.splice(draggedIndex, 1)
    newFilteredList.splice(targetIndex, 0, dragged)

    let newSortOrder = 0
    const prevItem = newFilteredList[targetIndex - 1]
    const nextItem = newFilteredList[targetIndex + 1]

    if (!prevItem && nextItem) {
      newSortOrder = (nextItem.sort_order || 2) - 1
    } else if (!nextItem && prevItem) {
      newSortOrder = (prevItem.sort_order || 0) + 1
    } else if (prevItem && nextItem) {
      newSortOrder = ((prevItem.sort_order || 0) + (nextItem.sort_order || 0)) / 2
    } else {
      newSortOrder = 1
    }

    itemToMove.sort_order = newSortOrder

    if (type === 'receivable') {
      setReceivables(
        [...list].sort(
          (a, b) =>
            (a.sort_order || 0) - (b.sort_order || 0) ||
            new Date(b.created).getTime() - new Date(a.created).getTime(),
        ),
      )
    } else {
      setLiabilities(
        [...list].sort(
          (a, b) =>
            (a.sort_order || 0) - (b.sort_order || 0) ||
            new Date(b.created).getTime() - new Date(a.created).getTime(),
        ),
      )
    }

    try {
      if (type === 'receivable') {
        await updateReceivable(draggedId, { sort_order: newSortOrder })
      } else {
        await updateLiability(draggedId, { sort_order: newSortOrder })
      }
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao reordenar: ' + (err.message || ''),
        variant: 'destructive',
      })
      loadData()
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif tracking-tight">Fluxo de Caixa</h2>
          <p className="text-muted-foreground mt-1">
            Gerenciamento previsível de entradas e saídas.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {user?.role === 'admin' && (
            <div className="w-full sm:w-56 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Cliente</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todos os Clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Clientes</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email || `Cliente ${u.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="w-full sm:w-56 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Filtrar por Ativo</Label>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Todos os Ativos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Ativos</SelectItem>
                {assets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border border-border/50 shadow-elevation bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-emerald-50/50 dark:bg-emerald-950/20 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-emerald-600">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                  <ArrowUpRight size={20} />
                </div>
                <CardTitle className="font-serif text-xl">Previsão de Entradas</CardTitle>
              </div>
              <AddReceivableDialog />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {filteredReceivables.map((r) => (
                <div
                  key={r.id}
                  className="group p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{r.source}</p>
                    {r.asset && assets.find((a) => a.id === r.asset) && (
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Ativo: {assets.find((a) => a.id === r.asset)?.name}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                      {r.expected_date && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon size={12} />{' '}
                          {new Date(r.expected_date).toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock size={12} /> {FREQUENCY_LABELS[r.frequency] || r.frequency}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <EditReceivableDialog receivable={r} />
                      <button
                        onClick={() =>
                          setItemToDelete({ type: 'receivable', id: r.id, name: r.source })
                        }
                        className="text-slate-400 hover:text-rose-500 transition-colors p-2 bg-background rounded-full shadow-sm border border-border/50 cursor-pointer"
                        title="Excluir Entrada"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-emerald-600 font-medium text-lg">
                      +{formatCurrency(convertValue(r.amount, 'BRL', currency), currency)}
                    </p>
                  </div>
                </div>
              ))}
              {filteredReceivables.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum fluxo programado para o filtro atual.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-elevation bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-rose-50/50 dark:bg-rose-950/20 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-full">
                  <ArrowDownRight size={20} />
                </div>
                <CardTitle className="font-serif text-xl">Passivos e Obrigações</CardTitle>
              </div>
              <AddLiabilityDialog />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {filteredLiabilities.map((l) => (
                <div
                  key={l.id}
                  className="group p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{l.name}</p>
                    {l.asset && assets.find((a) => a.id === l.asset) && (
                      <p className="text-xs text-rose-600 mt-0.5">
                        Ativo: {assets.find((a) => a.id === l.asset)?.name}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                      {l.is_recurring && l.monthly_due_day ? (
                        <div className="flex items-center gap-1">
                          <CalendarIcon size={12} /> Dia {l.monthly_due_day}
                        </div>
                      ) : l.due_date ? (
                        <div className="flex items-center gap-1">
                          <CalendarIcon size={12} /> {new Date(l.due_date).toLocaleDateString()}
                        </div>
                      ) : l.start_date ? (
                        <div className="flex items-center gap-1">
                          <CalendarIcon size={12} /> Início:{' '}
                          {new Date(l.start_date).toLocaleDateString()}
                        </div>
                      ) : null}
                      <span>
                        Saldo Restante:{' '}
                        {formatCurrency(
                          convertValue(l.remaining_balance, 'BRL', currency),
                          currency,
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <EditLiabilityDialog liability={l} />
                      <button
                        onClick={() =>
                          setItemToDelete({ type: 'liability', id: l.id, name: l.name })
                        }
                        className="text-slate-400 hover:text-rose-500 transition-colors p-2 bg-background rounded-full shadow-sm border border-border/50 cursor-pointer"
                        title="Excluir Obrigação"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-rose-600 font-medium text-lg">
                      -
                      {formatCurrency(
                        convertValue(l.monthly_installment || l.remaining_balance, 'BRL', currency),
                        currency,
                      )}
                      {l.is_recurring && (
                        <span className="text-sm text-muted-foreground font-normal">/mês</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
              {filteredLiabilities.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhuma obrigação cadastrada para o filtro atual.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <MonthlyProjection
        receivables={filteredReceivables}
        liabilities={filteredLiabilities}
        currency={currency}
        onReorder={handleReorder}
        overrides={overrides}
      />

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              A exclusão do item "{itemToDelete?.name}" é permanente e não poderá ser desfeita. Isso
              afetará as projeções do seu fluxo de caixa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
