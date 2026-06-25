import pb from '@/lib/pocketbase/client'

export const getUsers = async () => {
  return await pb.collection('users').getFullList({ sort: 'name' })
}
