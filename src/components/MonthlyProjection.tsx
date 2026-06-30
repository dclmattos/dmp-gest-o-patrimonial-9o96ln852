import { useState } from 'react'
import { addMonths, format, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, convertValue } from '@/hooks/use-currency'
import {
  findOverride,
  getBaseAmount,
  getDisplayDescription,
  shouldShowInMonth,
} from '@/lib/flow-utils'
import { QuickEditFlowDialog } from '@/components/QuickEditFlowDialog'
import { ArrowUpRight, ArrowDownRight, CheckCircle2, GripVertical } from 'lucide-react'

const MONTH_COUNT = 6

export function MonthlyProjection({
  receivables,
  liabilities,
  currency,
  onReorder,
  overrides,
  assets,
  readOnly = false,
}: {
  receivables: any[]
  liabilities: any[]
  currency: string
  onReorder?: (type: 'receivable' | 'liability', draggedId: string, targetId: string) => void
  overrides: any[]
  assets: any[]
  readOnly?: boolean
}) {
  const months = Array.from({ length: MONTH_COUNT }, (_, i) =>
    startOfMonth(addMonths(new Date(), i)),
  )
  const [quickEdit, setQuickEdit] = useState<{
    type: 'receivable' | 'liability'
    record: any
    month: Date
    override: any | null
  } | null>(null)
  const [draggedItem, setDraggedItem] = useState<{
    type: 'receivable' | 'liability'
    id: string
  } | null>(null)

  const getAmountForMonth = (
    record: any,
    type: 'receivable' | 'liability',
    month: Date,
  ): number | null => {
    if (!shouldShowInMonth(record, type, month)) return null
    const override = findOverride(overrides, record.id, type, month)
    if (override?.amount != null) return override.amount
    return getBaseAmount(record, type)
  }

  const isDone = (record: any, type: 'receivable' | 'liability', month: Date): boolean => {
    const override = findOverride(overrides, record.id, type, month)
    return override?.is_done || false
  }

  const handleCellClick = (record: any, type: 'receivable' | 'liability', month: Date) => {
    if (readOnly) return
    const override = findOverride(overrides, record.id, type, month)
    setQuickEdit({ type, record, month, override })
  }

  const handleDragStart = (type: 'receivable' | 'liability', id: string) => {
    if (readOnly || !onReorder) return
    setDraggedItem({ type, id })
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly || !onReorder) return
    e.preventDefault()
  }

  const handleDrop = (type: 'receivable' | 'liability', targetId: string) => {
    if (readOnly || !onReorder || !draggedItem) return
    if (draggedItem.type === type && draggedItem.id !== targetId) {
      onReorder(type, draggedItem.id, targetId)
    }
    setDraggedItem(null)
  }

  const renderRow = (record: any, type: 'receivable' | 'liability') => {
    const description = getDisplayDescription(record, type, null, assets)
    const amounts = months.map((m) => getAmountForMonth(record, type, m))
    const total = amounts.reduce((sum, a) => sum + (a || 0), 0)

    return (
      <tr
        key={record.id}
        draggable={!readOnly && !!onReorder}
        onDragStart={() => handleDragStart(type, record.id)}
        onDragOver={handleDragOver}
        onDrop={() => handleDrop(type, record.id)}
        className="border-b border-border/40 hover:bg-muted/30 transition-colors"
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            {!readOnly && onReorder && (
              <GripVertical size={14} className="text-muted-foreground cursor-grab shrink-0" />
            )}
            <span className="text-sm font-medium truncate">{description}</span>
          </div>
        </td>
        {months.map((m, i) => {
          const amount = amounts[i]
          const done = isDone(record, type, m)
          if (amount === null) {
            return (
              <td key={i} className="py-3 px-4 text-center text-muted-foreground/30">
                —
              </td>
            )
          }
          return (
            <td
              key={i}
              className={`py-3 px-4 text-center ${readOnly ? '' : 'cursor-pointer'} ${done ? 'opacity-50' : ''}`}
              onClick={() => handleCellClick(record, type, m)}
            >
              <div className="flex items-center justify-center gap-1">
                {done && <CheckCircle2 size={12} className="text-emerald-500" />}
                <span
                  className={`text-sm ${type === 'receivable' ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {type === 'receivable' ? '+' : '-'}
                  {formatCurrency(convertValue(amount, 'BRL', currency), currency)}
                </span>
              </div>
            </td>
          )
        })}
        <td className="py-3 px-4 text-center font-medium">
          {formatCurrency(convertValue(total, 'BRL', currency), currency)}
        </td>
      </tr>
    )
  }

  const monthlyTotals = months.map((m) => {
    const recTotal = receivables.reduce(
      (sum, r) => sum + (getAmountForMonth(r, 'receivable', m) || 0),
      0,
    )
    const liabTotal = liabilities.reduce(
      (sum, l) => sum + (getAmountForMonth(l, 'liability', m) || 0),
      0,
    )
    return recTotal - liabTotal
  })

  return (
    <Card className="border border-border/50 shadow-elevation overflow-hidden">
      <CardHeader className="border-b border-border/40">
        <CardTitle className="font-serif text-xl">Projeção Mensal</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Descrição
              </th>
              {months.map((m, i) => (
                <th
                  key={i}
                  className="py-3 px-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {format(m, 'MMM/yyyy', { locale: ptBR })}
                </th>
              ))}
              <th className="py-3 px-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {receivables.length > 0 && (
              <>
                <tr className="border-b border-border/40 bg-emerald-50/30 dark:bg-emerald-950/10">
                  <td colSpan={MONTH_COUNT + 2} className="py-2 px-4">
                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 uppercase tracking-wide">
                      <ArrowUpRight size={14} /> Entradas
                    </span>
                  </td>
                </tr>
                {receivables.map((r) => renderRow(r, 'receivable'))}
              </>
            )}
            {liabilities.length > 0 && (
              <>
                <tr className="border-b border-border/40 bg-rose-50/30 dark:bg-rose-950/10">
                  <td colSpan={MONTH_COUNT + 2} className="py-2 px-4">
                    <span className="text-xs font-medium text-rose-600 flex items-center gap-1 uppercase tracking-wide">
                      <ArrowDownRight size={14} /> Saídas
                    </span>
                  </td>
                </tr>
                {liabilities.map((l) => renderRow(l, 'liability'))}
              </>
            )}
            <tr className="border-t-2 border-border/60 bg-muted/20 font-medium">
              <td className="py-3 px-4 text-sm">Saldo Mensal</td>
              {monthlyTotals.map((total, i) => (
                <td key={i} className="py-3 px-4 text-center text-sm">
                  <span className={total >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {formatCurrency(convertValue(total, 'BRL', currency), currency)}
                  </span>
                </td>
              ))}
              <td className="py-3 px-4 text-center text-sm font-bold">
                {formatCurrency(
                  convertValue(
                    monthlyTotals.reduce((a, b) => a + b, 0),
                    'BRL',
                    currency,
                  ),
                  currency,
                )}
              </td>
            </tr>
          </tbody>
        </table>
        {receivables.length === 0 && liabilities.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum fluxo cadastrado para projeção.
          </div>
        )}
      </CardContent>
      {!readOnly && quickEdit && (
        <QuickEditFlowDialog
          open={!!quickEdit}
          onOpenChange={(open) => !open && setQuickEdit(null)}
          type={quickEdit.type}
          record={quickEdit.record}
          month={quickEdit.month}
          existingOverride={quickEdit.override}
        />
      )}
    </Card>
  )
}
