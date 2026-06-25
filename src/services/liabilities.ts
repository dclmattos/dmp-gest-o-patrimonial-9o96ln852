import pb from '@/lib/pocketbase/client'

export const getLiabilities = () => pb.collection('liabilities').getFullList()
export const createLiability = (data: any) => pb.collection('liabilities').create(data)
export const updateLiability = (id: string, data: any) =>
  pb.collection('liabilities').update(id, data)
export const deleteLiability = (id: string) => pb.collection('liabilities').delete(id)
