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
    can_edit_data?: boolean
  },
) => {
  const payload: Record<string, unknown> = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.email !== undefined) payload.email = data.email
  if (data.role !== undefined) payload.role = data.role
  if (data.can_edit_data !== undefined) payload.can_edit_data = data.can_edit_data
  if (data.password !== undefined && data.password !== '') {
    payload.password = data.password
    payload.passwordConfirm = data.passwordConfirm ?? data.password
  }
  return await pb.collection('users').update(id, payload)
}

export const deleteUser = async (id: string) => {
  return await pb.collection('users').delete(id)
}
