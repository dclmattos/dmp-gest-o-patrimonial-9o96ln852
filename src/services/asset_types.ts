import pb from '@/lib/pocketbase/client'
import { getSelectedUserId } from '@/stores/selectedUser'

export const getAssetTypes = async (userId?: string) => {
  const effectiveId = userId || pb.authStore.record?.id
  const filter = effectiveId ? `user = "${effectiveId}" || is_system = true` : `is_system = true`
  return await pb.collection('asset_types').getFullList({ filter, sort: 'name' })
}

export const createAssetType = async (data: any) => {
  const targetUser = getSelectedUserId() || pb.authStore.record?.id
  if (targetUser && !data.user) {
    data.user = targetUser
  }
  return await pb.collection('asset_types').create(data)
}

export const updateAssetType = async (id: string, data: any) => {
  return await pb.collection('asset_types').update(id, data)
}

export const deleteAssetType = async (id: string) => {
  return await pb.collection('asset_types').delete(id)
}
