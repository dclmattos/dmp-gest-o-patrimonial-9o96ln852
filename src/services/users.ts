import pb from '@/lib/pocketbase/client'

export const getUsers = async () => {
  return await pb.collection('users').getFullList({ sort: 'name' })
}

export const getUser = async (id: string) => {
  return await pb.collection('users').getOne(id)
}

export const createUser = async (data: {
  name: string
  email: string
  password: string
  passwordConfirm: string
  role: string
}) => {
  return await pb.collection('users').create(data)
}

export const updateUser = async (
  id: string,
  data: {
    name?: string
    email?: string
    role?: string
    password?: string
    passwordConfirm?: string
  },
) => {
  return await pb.collection('users').update(id, data)
}

export const deleteUser = async (id: string) => {
  return await pb.collection('users').delete(id)
}
