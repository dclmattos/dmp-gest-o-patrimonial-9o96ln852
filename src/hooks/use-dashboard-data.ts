import { useState, useEffect, useRef } from 'react'
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
  const [loading, setLoading] = useState(true)

  const effectiveUserIdRef = useRef(effectiveUserId)
  effectiveUserIdRef.current = effectiveUserId

  const isFirstLoadRef = useRef(true)

  const load = async () => {
    try {
      if (isFirstLoadRef.current) setLoading(true)
      const [a, l, r, vh] = await Promise.all([
        getAssets(effectiveUserIdRef.current),
        getLiabilities(effectiveUserIdRef.current),
        getReceivables(effectiveUserIdRef.current),
        getValuationHistory(effectiveUserIdRef.current),
      ])
      setAssets(a)
      setLiabilities(l)
      setReceivables(r)
      setValuationHistory(vh)
    } catch (e) {
      console.error(e)
    } finally {
      isFirstLoadRef.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    isFirstLoadRef.current = true
    load()
  }, [effectiveUserId])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedLoad = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load(), 150)
  }

  useRealtime('assets', debouncedLoad)
  useRealtime('liabilities', debouncedLoad)
  useRealtime('receivables', debouncedLoad)
  useRealtime('valuation_history', debouncedLoad)

  return { assets, liabilities, receivables, valuationHistory, refetch: load, loading }
}
