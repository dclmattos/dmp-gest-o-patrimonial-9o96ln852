import pb from '@/lib/pocketbase/client'

export const getAssets = () => pb.collection('assets').getFullList()
export const createAsset = (data: any) => pb.collection('assets').create(data)
export const updateAsset = (id: string, data: any) => pb.collection('assets').update(id, data)
export const deleteAsset = (id: string) => pb.collection('assets').delete(id)
