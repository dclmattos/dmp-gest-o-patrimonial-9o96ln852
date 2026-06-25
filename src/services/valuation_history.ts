import pb from '@/lib/pocketbase/client'
import { getSelectedUserId } from '@/stores/selectedUser'

export const getValuationHistory = async (userId?: string) => {
  const filter = userId ? `user = "${userId}"` : ''
  return await pb.collection('valuation_history').getFullList({ filter })
}

export const createValuationHistory = async (data: any) => {
  const targetUser = getSelectedUserId() || pb.authStore.record?.id
  if (targetUser && !data.user) {
    data.user = targetUser
  }
  return await pb.collection('valuation_history').create(data)
}

export const updateValuationHistory = async (id: string, data: any) => {
  return await pb.collection('valuation_history').update(id, data)
}

export const deleteValuationHistory = async (id: string) => {
  return await pb.collection('valuation_history').delete(id)
}
