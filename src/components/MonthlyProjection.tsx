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
import { Calendar as CalendarIcon } from 'lucide-react'
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
}

export function MonthlyProjection({ receivables, liabilities, currency }: MonthlyProjectionProps) {
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

  const reportWithCumulative = useMemo(() => {
    const data = months.map((month) => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)

      let totalIn = 0
      receivables.forEach((r) => {
        const amount = convertValue(r.amount, 'BRL', currency)
        if (!r.expected_date) return
        const expected = new Date(r.expected_date)

        if (r.frequency === 'one-time') {
          if (isSameMonth(expected, month)) {
            totalIn += amount
          }
        } else {
          if (expected <= monthEnd) {
            const diffMonths =
              (getYear(month) - getYear(expected)) * 12 + (getMonth(month) - getMonth(expected))
            if (diffMonths >= 0) {
              if (r.frequency === 'monthly') totalIn += amount
              else if (r.frequency === 'quarterly' && diffMonths % 3 === 0) totalIn += amount
              else if (r.frequency === 'yearly' && diffMonths % 12 === 0) totalIn += amount
            }
          }
        }
      })

      let totalOut = 0
      liabilities.forEach((l) => {
        const amount = convertValue(
          l.monthly_installment || l.remaining_balance || 0,
          'BRL',
          currency,
        )

        if (l.is_recurring) {
          const start = l.start_date
            ? new Date(l.start_date)
            : l.due_date
              ? new Date(l.due_date)
              : null
          const end = l.end_date ? new Date(l.end_date) : null

          if (start && start <= monthEnd && (!end || end >= monthStart)) {
            totalOut += amount
          }
        } else {
          if (l.due_date) {
            const due = new Date(l.due_date)
            if (isSameMonth(due, month)) {
              totalOut += amount
            }
          } else if (l.start_date) {
            const start = new Date(l.start_date)
            if (isSameMonth(start, month)) {
              totalOut += amount
            }
          }
        }
      })

      return {
        month,
        inflow: totalIn,
        outflow: totalOut,
        balance: totalIn - totalOut,
      }
    })

    let runningTotal = 0
    return data.map((d) => {
      runningTotal += d.balance
      return { ...d, cumulative: runningTotal }
    })
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

      {reportWithCumulative.length > 0 ? (
        <div className="rounded-md border border-border/50 shadow-elevation bg-white dark:bg-slate-900 overflow-x-auto relative">
          <Table className="min-w-max">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[200px] sticky left-0 bg-muted/50 z-10 whitespace-nowrap border-r border-border/40">
                  Resumo
                </TableHead>
                {reportWithCumulative.map((d, i) => (
                  <TableHead
                    key={i}
                    className="text-right min-w-[120px] whitespace-nowrap capitalize"
                  >
                    {format(d.month, 'MMM/yyyy', { locale: ptBR })}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-border/40 whitespace-nowrap">
                  Entradas (Total)
                </TableCell>
                {reportWithCumulative.map((d, i) => (
                  <TableCell key={i} className="text-right text-emerald-600 whitespace-nowrap">
                    {formatCurrency(d.inflow, currency)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-border/40 whitespace-nowrap">
                  Saídas (Total)
                </TableCell>
                {reportWithCumulative.map((d, i) => (
                  <TableCell key={i} className="text-right text-rose-600 whitespace-nowrap">
                    -{formatCurrency(d.outflow, currency)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-border/40 whitespace-nowrap">
                  Saldo Mensal
                </TableCell>
                {reportWithCumulative.map((d, i) => (
                  <TableCell
                    key={i}
                    className={`text-right font-medium whitespace-nowrap ${
                      d.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {d.balance >= 0 && d.balance > 0 ? '+' : ''}
                    {formatCurrency(d.balance, currency)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableCell className="font-bold sticky left-0 bg-muted/20 z-10 border-r border-border/40 whitespace-nowrap">
                  Saldo Acumulado
                </TableCell>
                {reportWithCumulative.map((d, i) => (
                  <TableCell
                    key={i}
                    className={`text-right font-bold whitespace-nowrap ${
                      d.cumulative >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {d.cumulative >= 0 && d.cumulative > 0 ? '+' : ''}
                    {formatCurrency(d.cumulative, currency)}
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
