import pb from '@/lib/pocketbase/client'
import { getSelectedUserId } from '@/stores/selectedUser'

export const getAssetCategories = async (userId?: string) => {
  const filter = userId ? `user = "${userId}"` : ''
  return await pb.collection('asset_categories').getFullList({ filter, sort: 'sort_order,created' })
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

export const seedDefaultCategories = async (userId: string) => {
  const existing = await pb.collection('asset_categories').getFullList({
    filter: `user = "${userId}"`,
  })
  const existingNames = new Set(existing.map((c) => c.name))

  const defaults = [
    { name: 'Imóveis', color: '#3b82f6', icon: 'Home', sort_order: 1 },
    { name: 'Veículos', color: '#22c55e', icon: 'Car', sort_order: 2 },
    { name: 'Investimentos', color: '#f59e0b', icon: 'Briefcase', sort_order: 3 },
    { name: 'Reserva de Emergência', color: '#ef4444', icon: 'PiggyBank', sort_order: 4 },
  ]

  for (const d of defaults) {
    if (!existingNames.has(d.name)) {
      await pb.collection('asset_categories').create({
        user: userId,
        name: d.name,
        color: d.color,
        icon: d.icon,
        sort_order: d.sort_order,
        goal_value: 0,
      })
    }
  }
}
