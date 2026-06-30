import pb from '@/lib/pocketbase/client'
import { getSelectedUserId } from '@/stores/selectedUser'

export interface FlowOverride {
  id: string
  user: string
  flow_type: 'receivable' | 'liability'
  flow_id: string
  month: string
  amount: number | null
  is_done: boolean
}

export const getFlowOverrides = async (userId?: string) => {
  const filter = userId ? `user = "${userId}"` : ''
  return await pb.collection('flow_overrides').getFullList({ filter, sort: '-created' })
}

export const createFlowOverride = async (data: Partial<FlowOverride>) => {
  const targetUser = getSelectedUserId() || pb.authStore.record?.id
  if (targetUser && !data.user) {
    data.user = targetUser
  }
  return await pb.collection('flow_overrides').create(data)
}

export const updateFlowOverride = async (id: string, data: Partial<FlowOverride>) => {
  return await pb.collection('flow_overrides').update(id, data)
}

export const deleteFlowOverride = async (id: string) => {
  return await pb.collection('flow_overrides').delete(id)
}
