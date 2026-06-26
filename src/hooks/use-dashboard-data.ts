import { useState, useEffect } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { getAssets } from '@/services/assets'
import { getLiabilities } from '@/services/liabilities'
import { getReceivables } from '@/services/receivables'
import { getValuationHistory } from '@/services/valuation_history'
import { useAuth } from '@/hooks/use-auth'

export function useDashboardData(userId?: string) {
  const { user } = useAuth()
  const effectiveUserId =
    userId === 'all'
      ? user?.role === 'admin'
        ? undefined
        : user?.id
      : userId || (user?.role === 'user' ? user?.id : undefined)

  const [assets, setAssets] = useState<any[]>([])
  const [liabilities, setLiabilities] = useState<any[]>([])
  const [receivables, setReceivables] = useState<any[]>([])
  const [valuationHistory, setValuationHistory] = useState<any[]>([])

  const load = async () => {
    try {
      const [a, l, r, vh] = await Promise.all([
        getAssets(effectiveUserId),
        getLiabilities(effectiveUserId),
        getReceivables(effectiveUserId),
        getValuationHistory(effectiveUserId),
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
  }, [effectiveUserId])

  useRealtime('assets', (e) => {
    if (effectiveUserId && e.record.user !== effectiveUserId) return
    if (e.action === 'create') setAssets((prev) => [...prev, e.record])
    else if (e.action === 'update')
      setAssets((prev) => prev.map((item) => (item.id === e.record.id ? e.record : item)))
    else if (e.action === 'delete')
      setAssets((prev) => prev.filter((item) => item.id !== e.record.id))
    else load()
  })
  useRealtime('liabilities', (e) => {
    if (effectiveUserId && e.record.user !== effectiveUserId) return
    if (e.action === 'create') setLiabilities((prev) => [...prev, e.record])
    else if (e.action === 'update')
      setLiabilities((prev) => prev.map((item) => (item.id === e.record.id ? e.record : item)))
    else if (e.action === 'delete')
      setLiabilities((prev) => prev.filter((item) => item.id !== e.record.id))
    else load()
  })
  useRealtime('receivables', (e) => {
    if (effectiveUserId && e.record.user !== effectiveUserId) return
    if (e.action === 'create') setReceivables((prev) => [...prev, e.record])
    else if (e.action === 'update')
      setReceivables((prev) => prev.map((item) => (item.id === e.record.id ? e.record : item)))
    else if (e.action === 'delete')
      setReceivables((prev) => prev.filter((item) => item.id !== e.record.id))
    else load()
  })
  useRealtime('valuation_history', (e) => {
    if (effectiveUserId && e.record.user !== effectiveUserId) return
    if (e.action === 'create') setValuationHistory((prev) => [...prev, e.record])
    else if (e.action === 'update')
      setValuationHistory((prev) => prev.map((item) => (item.id === e.record.id ? e.record : item)))
    else if (e.action === 'delete')
      setValuationHistory((prev) => prev.filter((item) => item.id !== e.record.id))
    else load()
  })

  return { assets, liabilities, receivables, valuationHistory, refetch: load }
}
