import pb from '@/lib/pocketbase/client'

export const getReceivables = () => pb.collection('receivables').getFullList()
export const createReceivable = (data: any) => pb.collection('receivables').create(data)
export const updateReceivable = (id: string, data: any) =>
  pb.collection('receivables').update(id, data)
export const deleteReceivable = (id: string) => pb.collection('receivables').delete(id)
