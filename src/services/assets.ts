import pb from '@/lib/pocketbase/client'
import { getSelectedUserId } from '@/stores/selectedUser'

export const getAssets = async (userId?: string) => {
  const filter = userId ? `user = "${userId}"` : ''
  return await pb.collection('assets').getFullList({
    filter,
    sort: '-created',
    expand: 'category,type_ref',
  })
}

export const createAsset = async (data: any) => {
  const targetUser = getSelectedUserId() || pb.authStore.record?.id
  if (targetUser && !data.user) {
    data.user = targetUser
  }
  return await pb.collection('assets').create(data)
}

export const updateAsset = async (id: string, data: any) => {
  return await pb.collection('assets').update(id, data)
}

export const deleteAsset = async (id: string) => {
  return await pb.collection('assets').delete(id)
}
