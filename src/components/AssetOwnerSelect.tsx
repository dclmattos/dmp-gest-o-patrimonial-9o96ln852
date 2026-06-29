import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { getUsers } from '@/services/users'
import { updateAsset } from '@/services/assets'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

let cachedUsers: any[] | null = null
let fetchPromise: Promise<any[]> | null = null

async function fetchUsersCached(): Promise<any[]> {
  if (cachedUsers) return cachedUsers
  if (fetchPromise) return fetchPromise
  fetchPromise = getUsers()
    .then((data) => {
      cachedUsers = data
      return data
    })
    .catch((err) => {
      fetchPromise = null
      throw err
    })
  return fetchPromise
}

interface AssetOwnerSelectProps {
  asset: any
  onUpdate?: (updated: any) => void
}

export function AssetOwnerSelect({ asset, onUpdate }: AssetOwnerSelectProps) {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [transferring, setTransferring] = useState(false)

  const isAdmin = currentUser?.role === 'admin'
  const isOwner = asset.user === currentUser?.id
  const canTransfer = isAdmin || isOwner

  useEffect(() => {
    if (!canTransfer) return
    let mounted = true
    fetchUsersCached()
      .then((data) => {
        if (mounted) setUsers(data)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [canTransfer])

  const currentOwner = users.find((u) => u.id === asset.user)
  const ownerName = currentOwner
    ? currentOwner.name || currentOwner.email
    : isOwner
      ? currentUser?.name || currentUser?.email || 'Você'
      : 'Desconhecido'

  const handleTransfer = async (newUserId: string) => {
    if (newUserId === asset.user || transferring) return
    setTransferring(true)
    try {
      const updated = await updateAsset(asset.id, { user: newUserId })
      toast({ title: 'Sucesso', description: 'Proprietário transferido com sucesso.' })
      onUpdate?.(updated)
    } catch {
      toast({
        title: 'Erro',
        description: 'Falha ao transferir propriedade.',
        variant: 'destructive',
      })
    } finally {
      setTransferring(false)
    }
  }

  if (!canTransfer || !currentOwner) {
    return (
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Proprietário</span>
        <span className="font-medium truncate max-w-[150px]">{ownerName}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between text-xs gap-2">
      <span className="text-muted-foreground shrink-0">Proprietário</span>
      <Select value={asset.user} onValueChange={handleTransfer} disabled={transferring}>
        <SelectTrigger className="h-7 w-auto min-w-[130px] max-w-[180px] text-xs font-medium">
          {transferring && <Loader2 size={12} className="animate-spin mr-1 shrink-0" />}
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id} className="text-xs">
              {u.name || u.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
