import pb from '@/lib/pocketbase/client'

export const getAssetCategories = () =>
  pb.collection('asset_categories').getFullList({ sort: '-created' })

export const getAssetCategory = (id: string) => pb.collection('asset_categories').getOne(id)

export const createAssetCategory = (data: {
  user: string
  name: string
  color?: string
  icon?: string
  goal_value?: number
}) => pb.collection('asset_categories').create(data)

export const updateAssetCategory = (
  id: string,
  data: Partial<{ name: string; color: string; icon: string; goal_value: number }>,
) => pb.collection('asset_categories').update(id, data)

export const deleteAssetCategory = (id: string) => pb.collection('asset_categories').delete(id)
