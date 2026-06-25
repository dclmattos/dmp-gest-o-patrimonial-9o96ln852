import { createContext, useContext, useState, ReactNode } from 'react'

export type Currency = 'BRL' | 'USD'

interface CurrencyContextType {
  currency: Currency
  setCurrency: (c: Currency) => void
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'BRL',
  setCurrency: () => {},
})

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('BRL')
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}

export function convertValue(val: number, from: string, to: Currency): number {
  if (!val) return 0
  if (from === to) return val
  if (from === 'BRL' && to === 'USD') return val / 5.2
  if (from === 'USD' && to === 'BRL') return val * 5.2
  if (from === 'EUR' && to === 'BRL') return val * 5.6
  if (from === 'EUR' && to === 'USD') return val * 1.08
  return val
}

export function formatCurrency(val: number, currency: Currency): string {
  if (isNaN(val)) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(val)
}
