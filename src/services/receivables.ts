import pb from '@/lib/pocketbase/client'
import { getSelectedUserId } from '@/stores/selectedUser'

export const getReceivables = async (userId?: string) => {
  const filter = userId ? `user = "${userId}"` : ''
  return await pb.collection('receivables').getFullList({ filter, sort: 'sort_order,-created' })
}

export const createReceivable = async (data: any) => {
  const targetUser = getSelectedUserId() || pb.authStore.record?.id
  if (targetUser && !data.user) {
    data.user = targetUser
  }
  return await pb.collection('receivables').create(data)
}

export const updateReceivable = async (id: string, data: any) => {
  return await pb.collection('receivables').update(id, data)
}

export const deleteReceivable = async (id: string) => {
  return await pb.collection('receivables').delete(id)
}
