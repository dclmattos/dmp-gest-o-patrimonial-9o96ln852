import { useState, useMemo } from 'react'
import { addMonths, format, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, convertValue } from '@/hooks/use-currency'
import { QuickEditFlowDialog } from '@/components/QuickEditFlowDialog'
import { CheckCircle2, ArrowUpRight, ArrowDownRight, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  findOverride,
  getBaseDescription,
  getBaseAmount,
  shouldShowInMonth,
} from '@/lib/flow-utils'

interface MonthlyProjectionProps {
  receivables: any[]
  liabilities: any[]
  currency: any
  onReorder: (type: 'receivable' | 'liability', draggedId: string, targetId: string) => void
  overrides: any[]
  assets: any[]
}

export function MonthlyProjection({
  receivables,
  liabilities,
  currency,
  onReorder,
  overrides,
  assets,
}: MonthlyProjectionProps) {
  const months = useMemo(() => {
    const result: Date[] = []
    const start = startOfMonth(new Date())
    for (let i = 0; i < 12; i++) result.push(addMonths(start, i))
    return result
  }, [])

  const [edit, setEdit] = useState<{
    open: boolean
    type: 'receivable' | 'liability'
    record: any
    month: Date | null
    override: any
  }>({ open: false, type: 'receivable', record: null, month: null, override: null })

  const [draggedItem, setDraggedItem] = useState<{ type: string; id: string } | null>(null)

  const openEdit = (type: 'receivable' | 'liability', record: any, month: Date) => {
    const override = findOverride(overrides, record.id, type, month)
    setEdit({ open: true, type, record, month, override })
  }

  const renderRow = (record: any, type: 'receivable' | 'liability') => {
    const desc = getBaseDescription(record, type, assets)
    const hasAnyVisible = months.some((m) => shouldShowInMonth(record, type, m))
    if (!hasAnyVisible) return null

    return (
      <tr key={record.id} className="border-b border-border/30 hover:bg-muted/20">
        <td className="sticky left-0 bg-background z-10 min-w-[200px] max-w-[250px] py-3 px-3">
          <div className="flex items-center gap-2">
            <button
              draggable
              onDragStart={() => setDraggedItem({ type, id: record.id })}
              onDragEnd={() => setDraggedItem(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedItem && draggedItem.id !== record.id) {
                  onReorder(draggedItem.type as any, draggedItem.id, record.id)
                }
                setDraggedItem(null)
              }}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
              <GripVertical size={14} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{desc}</p>
            </div>
          </div>
        </td>
        {months.map((month) => {
          if (!shouldShowInMonth(record, type, month)) {
            return <td key={month.toISOString()} className="py-2 px-2 min-w-[110px]" />
          }
          const override = findOverride(overrides, record.id, type, month)
          const amount = override?.amount != null ? override.amount : getBaseAmount(record, type)
          const isDone = override?.is_done || false
          const hasDescOverride = !!override?.description
          return (
            <td key={month.toISOString()} className="py-2 px-2 min-w-[110px]">
              <button
                onClick={() => openEdit(type, record, month)}
                className="w-full text-left p-1.5 rounded hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      type === 'receivable' ? 'text-emerald-600' : 'text-rose-600',
                    )}
                  >
                    {type === 'receivable' ? '+' : '-'}
                    {formatCurrency(convertValue(amount, 'BRL', currency), currency)}
                  </span>
                  {isDone && <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />}
                  {hasDescOverride && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"
                      title="Descrição personalizada"
                    />
                  )}
                </div>
                {hasDescOverride && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {override.description}
                  </p>
                )}
              </button>
            </td>
          )
        })}
      </tr>
    )
  }

  return (
    <>
      <Card className="border border-border/50 shadow-elevation bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-5">
          <CardTitle className="font-serif text-xl">Projeção Mensal</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="sticky left-0 bg-background z-10 text-left py-3 px-3 min-w-[200px] font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Item
                  </th>
                  {months.map((m) => (
                    <th
                      key={m.toISOString()}
                      className="py-3 px-2 text-center min-w-[110px] text-muted-foreground font-medium text-xs capitalize"
                    >
                      {format(m, 'MMM/yy', { locale: ptBR })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receivables.length > 0 && (
                  <tr className="border-b border-border/40 bg-emerald-50/30 dark:bg-emerald-950/10">
                    <td colSpan={months.length + 1} className="py-2 px-3">
                      <span className="flex items-center gap-2 text-emerald-600 font-medium text-xs uppercase tracking-wide">
                        <ArrowUpRight size={14} /> Entradas
                      </span>
                    </td>
                  </tr>
                )}
                {receivables.map((r) => renderRow(r, 'receivable'))}
                {liabilities.length > 0 && (
                  <tr className="border-b border-border/40 bg-rose-50/30 dark:bg-rose-950/10">
                    <td colSpan={months.length + 1} className="py-2 px-3">
                      <span className="flex items-center gap-2 text-rose-600 font-medium text-xs uppercase tracking-wide">
                        <ArrowDownRight size={14} /> Saídas
                      </span>
                    </td>
                  </tr>
                )}
                {liabilities.map((l) => renderRow(l, 'liability'))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <QuickEditFlowDialog
        open={edit.open}
        onOpenChange={(open) => setEdit((prev) => ({ ...prev, open }))}
        type={edit.type}
        record={edit.record}
        month={edit.month}
        existingOverride={edit.override}
      />
    </>
  )
}
