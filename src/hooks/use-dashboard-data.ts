import { useState, useEffect } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { getAssets } from '@/services/assets'
import { getLiabilities } from '@/services/liabilities'
import { getReceivables } from '@/services/receivables'
import { getValuationHistory } from '@/services/valuation_history'

export function useDashboardData() {
  const [assets, setAssets] = useState<any[]>([])
  const [liabilities, setLiabilities] = useState<any[]>([])
  const [receivables, setReceivables] = useState<any[]>([])
  const [valuationHistory, setValuationHistory] = useState<any[]>([])

  const load = async () => {
    try {
      const [a, l, r, vh] = await Promise.all([
        getAssets(),
        getLiabilities(),
        getReceivables(),
        getValuationHistory(),
      ])
      setAssets(a)
      setLiabilities(l)
      setReceivables(r)
      setValuationHistory(vh)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('assets', () => {
    load()
  })
  useRealtime('liabilities', () => {
    load()
  })
  useRealtime('receivables', () => {
    load()
  })
  useRealtime('valuation_history', () => {
    load()
  })

  return { assets, liabilities, receivables, valuationHistory }
}
