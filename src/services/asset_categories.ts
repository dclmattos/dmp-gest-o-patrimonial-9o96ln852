import pb from '@/lib/pocketbase/client'
import { getSelectedUserId } from '@/stores/selectedUser'

export const getAssetCategories = async (userId?: string) => {
  const filter = userId ? `user = "${userId}"` : ''
  return await pb.collection('asset_categories').getFullList({ filter })
}

export const getAssetCategory = async (id: string) => {
  return await pb.collection('asset_categories').getOne(id)
}

export const createAssetCategory = async (data: any) => {
  const targetUser = getSelectedUserId() || pb.authStore.record?.id
  if (targetUser && !data.user) {
    data.user = targetUser
  }
  return await pb.collection('asset_categories').create(data)
}

export const updateAssetCategory = async (id: string, data: any) => {
  return await pb.collection('asset_categories').update(id, data)
}

export const deleteAssetCategory = async (id: string) => {
  return await pb.collection('asset_categories').delete(id)
}
