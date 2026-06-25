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

  useRealtime('assets', (e) => {
    if (e.action === 'create') setAssets((prev) => [...prev, e.record])
    else if (e.action === 'update')
      setAssets((prev) => prev.map((item) => (item.id === e.record.id ? e.record : item)))
    else if (e.action === 'delete')
      setAssets((prev) => prev.filter((item) => item.id !== e.record.id))
    else load()
  })
  useRealtime('liabilities', (e) => {
    if (e.action === 'create') setLiabilities((prev) => [...prev, e.record])
    else if (e.action === 'update')
      setLiabilities((prev) => prev.map((item) => (item.id === e.record.id ? e.record : item)))
    else if (e.action === 'delete')
      setLiabilities((prev) => prev.filter((item) => item.id !== e.record.id))
    else load()
  })
  useRealtime('receivables', (e) => {
    if (e.action === 'create') setReceivables((prev) => [...prev, e.record])
    else if (e.action === 'update')
      setReceivables((prev) => prev.map((item) => (item.id === e.record.id ? e.record : item)))
    else if (e.action === 'delete')
      setReceivables((prev) => prev.filter((item) => item.id !== e.record.id))
    else load()
  })
  useRealtime('valuation_history', (e) => {
    if (e.action === 'create') setValuationHistory((prev) => [...prev, e.record])
    else if (e.action === 'update')
      setValuationHistory((prev) => prev.map((item) => (item.id === e.record.id ? e.record : item)))
    else if (e.action === 'delete')
      setValuationHistory((prev) => prev.filter((item) => item.id !== e.record.id))
    else load()
  })

  return { assets, liabilities, receivables, valuationHistory, refetch: load }
}
