import pb from '@/lib/pocketbase/client'

export const getValuationHistory = () => pb.collection('valuation_history').getFullList()
export const createValuationHistory = (data: any) => pb.collection('valuation_history').create(data)
