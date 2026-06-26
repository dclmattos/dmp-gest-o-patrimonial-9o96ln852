import pb from '@/lib/pocketbase/client'
import { getSelectedUserId } from '@/stores/selectedUser'

export const getLiabilities = async (userId?: string) => {
  const filter = userId ? `user = "${userId}"` : ''
  return await pb.collection('liabilities').getFullList({ filter, sort: 'sort_order,-created' })
}

export const createLiability = async (data: any) => {
  const targetUser = getSelectedUserId() || pb.authStore.record?.id
  if (targetUser && !data.user) {
    data.user = targetUser
  }
  return await pb.collection('liabilities').create(data)
}

export const updateLiability = async (id: string, data: any) => {
  return await pb.collection('liabilities').update(id, data)
}

export const deleteLiability = async (id: string) => {
  return await pb.collection('liabilities').delete(id)
}
