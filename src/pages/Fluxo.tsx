import { useEffect, useState } from 'react'
import { getReceivables } from '@/services/receivables'
import { getLiabilities } from '@/services/liabilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, useCurrency, convertValue } from '@/hooks/use-currency'
import { ArrowDownRight, ArrowUpRight, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { AddReceivableDialog } from '@/components/AddReceivableDialog'
import { AddLiabilityDialog } from '@/components/AddLiabilityDialog'
import { EditReceivableDialog } from '@/components/EditReceivableDialog'
import { EditLiabilityDialog } from '@/components/EditLiabilityDialog'
import { Trash2 } from 'lucide-react'
import { deleteReceivable } from '@/services/receivables'
import { deleteLiability } from '@/services/liabilities'
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

const FREQUENCY_LABELS: Record<string, string> = {
  'one-time': 'Única',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
}

export default function Fluxo() {
  const [receivables, setReceivables] = useState<any[]>([])
  const [liabilities, setLiabilities] = useState<any[]>([])
  const { currency } = useCurrency()
  const { toast } = useToast()
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'receivable' | 'liability'
    id: string
    name: string
  } | null>(null)

  const loadData = () => {
    getReceivables().then(setReceivables)
    getLiabilities().then(setLiabilities)
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('receivables', loadData)
  useRealtime('liabilities', loadData)

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

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-serif tracking-tight">Fluxo de Caixa</h2>
        <p className="text-muted-foreground mt-1">Gerenciamento previsível de entradas e saídas.</p>
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
              {receivables.map((r) => (
                <div
                  key={r.id}
                  className="group p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{r.source}</p>
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
              {receivables.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum fluxo programado.
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
              {liabilities.map((l) => (
                <div
                  key={l.id}
                  className="group p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{l.name}</p>
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
                        convertValue(l.monthly_installment, 'BRL', currency),
                        currency,
                      )}
                      <span className="text-sm text-muted-foreground font-normal">/mês</span>
                    </p>
                  </div>
                </div>
              ))}
              {liabilities.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhuma obrigação cadastrada.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
