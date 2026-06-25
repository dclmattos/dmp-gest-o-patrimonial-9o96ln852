import { useState, useEffect } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { getAssets } from '@/services/assets'
import { getLiabilities } from '@/services/liabilities'
import { getReceivables } from '@/services/receivables'

export function useDashboardData() {
  const [assets, setAssets] = useState<any[]>([])
  const [liabilities, setLiabilities] = useState<any[]>([])
  const [receivables, setReceivables] = useState<any[]>([])

  const load = async () => {
    try {
      const [a, l, r] = await Promise.all([getAssets(), getLiabilities(), getReceivables()])
      setAssets(a)
      setLiabilities(l)
      setReceivables(r)
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

  return { assets, liabilities, receivables }
}
