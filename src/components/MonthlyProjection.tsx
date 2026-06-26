import { useMemo, useState } from 'react'
import {
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  getYear,
  getMonth,
  isSameMonth,
  addMonths,
  format,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency, convertValue } from '@/hooks/use-currency'
import { Calendar as CalendarIcon, GripVertical } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface MonthlyProjectionProps {
  receivables: any[]
  liabilities: any[]
  currency: string
  onReorder?: (type: 'receivable' | 'liability', draggedId: string, targetId: string) => void
}

export function MonthlyProjection({
  receivables,
  liabilities,
  currency,
  onReorder,
}: MonthlyProjectionProps) {
  const [draggedItem, setDraggedItem] = useState<{ id: string; type: string } | null>(null)
  const [dragOverItem, setDragOverItem] = useState<{ id: string; type: string } | null>(null)

  const handleDragStart = (e: React.DragEvent, id: string, type: 'receivable' | 'liability') => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, type }))
    e.dataTransfer.effectAllowed = 'move'
    setDraggedItem({ id, type })
  }

  const handleDragOver = (e: React.DragEvent, id: string, type: 'receivable' | 'liability') => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedItem?.id !== id && draggedItem?.type === type) {
      setDragOverItem({ id, type })
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverItem(null)
  }

  const handleDrop = (e: React.DragEvent, id: string, type: 'receivable' | 'liability') => {
    e.preventDefault()
    setDragOverItem(null)
    setDraggedItem(null)

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (data.type !== type || data.id === id || !onReorder) return

      onReorder(data.type, data.id, id)
    } catch {
      /* intentionally ignored */
    }
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(addMonths(new Date(), 5)),
  })

  const months = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return []
    try {
      return eachMonthOfInterval({ start: dateRange.from, end: dateRange.to })
    } catch {
      return []
    }
  }, [dateRange])

  const projectionData = useMemo(() => {
    const receivableRows = receivables.map((r) => {
      const amount = convertValue(r.amount, 'BRL', currency)
      const expected = r.expected_date ? new Date(r.expected_date) : null

      const amounts = months.map((month) => {
        if (!expected) return 0
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)
        let itemTotal = 0

        if (r.frequency === 'one-time') {
          if (isSameMonth(expected, month)) {
            itemTotal = amount
          }
        } else {
          if (expected <= monthEnd) {
            const diffMonths =
              (getYear(month) - getYear(expected)) * 12 + (getMonth(month) - getMonth(expected))
            if (diffMonths >= 0) {
              if (r.frequency === 'monthly') itemTotal = amount
              else if (r.frequency === 'quarterly' && diffMonths % 3 === 0) itemTotal = amount
              else if (r.frequency === 'yearly' && diffMonths % 12 === 0) itemTotal = amount
            }
          }
        }
        return itemTotal
      })
      return { id: r.id, source: r.source, amounts }
    })

    const liabilityRows = liabilities.map((l) => {
      const amount = convertValue(
        l.monthly_installment || l.remaining_balance || 0,
        'BRL',
        currency,
      )
      const start = l.start_date ? new Date(l.start_date) : l.due_date ? new Date(l.due_date) : null
      const end = l.end_date ? new Date(l.end_date) : null

      const amounts = months.map((month) => {
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)
        let itemTotal = 0

        if (l.is_recurring) {
          if (start && start <= monthEnd && (!end || end >= monthStart)) {
            itemTotal = amount
          }
        } else {
          if (l.due_date) {
            const due = new Date(l.due_date)
            if (isSameMonth(due, month)) {
              itemTotal = amount
            }
          } else if (l.start_date) {
            const s = new Date(l.start_date)
            if (isSameMonth(s, month)) {
              itemTotal = amount
            }
          }
        }
        return itemTotal
      })
      return { id: l.id, name: l.name, amounts }
    })

    const totals = months.map((_, i) => {
      const totalIn = receivableRows.reduce((sum, r) => sum + r.amounts[i], 0)
      const totalOut = liabilityRows.reduce((sum, l) => sum + l.amounts[i], 0)
      return { totalIn, totalOut, balance: totalIn - totalOut }
    })

    let runningTotal = 0
    const summary = totals.map((t) => {
      runningTotal += t.balance
      return { ...t, cumulative: runningTotal }
    })

    return { receivableRows, liabilityRows, summary }
  }, [months, receivables, liabilities, currency])

  return (
    <div className="mt-12 space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h3 className="text-xl font-serif tracking-tight">Projeção Mensal</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe o saldo projetado no período selecionado.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Label className="block mb-2 text-sm">Período da Projeção</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full sm:w-[280px] justify-start text-left font-normal bg-white dark:bg-slate-900',
                  !dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                    </>
                  ) : (
                    format(dateRange.from, 'dd/MM/yyyy')
                  )
                ) : (
                  <span>Selecione o período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange as any}
                onSelect={(range) => setDateRange(range as any)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {months.length > 0 ? (
        <div className="rounded-md border border-border/50 shadow-elevation bg-white dark:bg-slate-900 overflow-x-auto relative">
          <Table className="min-w-max">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[200px] sticky left-0 bg-muted/50 z-20 whitespace-nowrap border-r border-border/40">
                  Descrição
                </TableHead>
                {months.map((month, i) => (
                  <TableHead
                    key={i}
                    className="text-right min-w-[120px] whitespace-nowrap capitalize"
                  >
                    {format(month, 'MMM/yyyy', { locale: ptBR })}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectionData.receivableRows.length > 0 && (
                <>
                  <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20">
                    <TableCell
                      colSpan={months.length + 1}
                      className="font-semibold text-emerald-700 dark:text-emerald-400 sticky left-0 z-10 border-r border-border/40"
                    >
                      Entradas
                    </TableCell>
                  </TableRow>
                  {projectionData.receivableRows.map((r) => (
                    <TableRow
                      key={r.id}
                      draggable={!!onReorder}
                      onDragStart={(e) => handleDragStart(e, r.id, 'receivable')}
                      onDragOver={(e) => handleDragOver(e, r.id, 'receivable')}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, r.id, 'receivable')}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        onReorder && 'cursor-move transition-colors',
                        draggedItem?.id === r.id && 'opacity-50',
                        dragOverItem?.id === r.id &&
                          dragOverItem?.type === 'receivable' &&
                          'bg-emerald-100/50 dark:bg-emerald-900/40',
                      )}
                    >
                      <TableCell className="sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-border/40 pl-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {onReorder && (
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                          )}
                          <span className={cn(!onReorder && 'ml-4')}>{r.source}</span>
                        </div>
                      </TableCell>
                      {r.amounts.map((amt, i) => (
                        <TableCell
                          key={i}
                          className="text-right text-emerald-600 whitespace-nowrap"
                        >
                          {amt > 0 ? formatCurrency(amt, currency) : '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              )}

              {projectionData.liabilityRows.length > 0 && (
                <>
                  <TableRow className="bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-50/50 dark:hover:bg-rose-950/20">
                    <TableCell
                      colSpan={months.length + 1}
                      className="font-semibold text-rose-700 dark:text-rose-400 sticky left-0 z-10 border-r border-border/40"
                    >
                      Saídas / Obrigações
                    </TableCell>
                  </TableRow>
                  {projectionData.liabilityRows.map((l) => (
                    <TableRow
                      key={l.id}
                      draggable={!!onReorder}
                      onDragStart={(e) => handleDragStart(e, l.id, 'liability')}
                      onDragOver={(e) => handleDragOver(e, l.id, 'liability')}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, l.id, 'liability')}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        onReorder && 'cursor-move transition-colors',
                        draggedItem?.id === l.id && 'opacity-50',
                        dragOverItem?.id === l.id &&
                          dragOverItem?.type === 'liability' &&
                          'bg-rose-100/50 dark:bg-rose-900/40',
                      )}
                    >
                      <TableCell className="sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-border/40 pl-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {onReorder && (
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                          )}
                          <span className={cn(!onReorder && 'ml-4')}>{l.name}</span>
                        </div>
                      </TableCell>
                      {l.amounts.map((amt, i) => (
                        <TableCell key={i} className="text-right text-rose-600 whitespace-nowrap">
                          {amt > 0 ? `-${formatCurrency(amt, currency)}` : '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              )}

              <TableRow className="bg-muted/10 hover:bg-muted/10">
                <TableCell className="font-medium sticky left-0 bg-muted/10 z-10 border-r border-border/40 whitespace-nowrap">
                  Total Entradas
                </TableCell>
                {projectionData.summary.map((s, i) => (
                  <TableCell key={i} className="text-right text-emerald-600 whitespace-nowrap">
                    {formatCurrency(s.totalIn, currency)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-muted/10 hover:bg-muted/10">
                <TableCell className="font-medium sticky left-0 bg-muted/10 z-10 border-r border-border/40 whitespace-nowrap">
                  Total Saídas
                </TableCell>
                {projectionData.summary.map((s, i) => (
                  <TableCell key={i} className="text-right text-rose-600 whitespace-nowrap">
                    -{formatCurrency(s.totalOut, currency)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-t-2 border-border">
                <TableCell className="font-bold sticky left-0 bg-muted/20 z-10 border-r border-border/40 whitespace-nowrap">
                  Saldo Mensal
                </TableCell>
                {projectionData.summary.map((s, i) => (
                  <TableCell
                    key={i}
                    className={`text-right font-bold whitespace-nowrap ${
                      s.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {s.balance >= 0 && s.balance > 0 ? '+' : ''}
                    {formatCurrency(s.balance, currency)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableCell className="font-bold sticky left-0 bg-muted/20 z-10 border-r border-border/40 whitespace-nowrap">
                  Saldo Acumulado
                </TableCell>
                {projectionData.summary.map((s, i) => (
                  <TableCell
                    key={i}
                    className={`text-right font-bold whitespace-nowrap ${
                      s.cumulative >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {s.cumulative >= 0 && s.cumulative > 0 ? '+' : ''}
                    {formatCurrency(s.cumulative, currency)}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground border border-border/50 rounded-md bg-white dark:bg-slate-900">
          Selecione um período válido para visualizar a projeção.
        </div>
      )}
    </div>
  )
}
