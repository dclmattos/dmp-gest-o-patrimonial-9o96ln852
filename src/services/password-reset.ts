import pb from '@/lib/pocketbase/client'

export const requestPasswordReset = async (email: string) => {
  return await pb.send('/backend/v1/otp/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const resetPassword = async (email: string, code: string, newPassword: string) => {
  return await pb.send('/backend/v1/password/reset', {
    method: 'POST',
    body: JSON.stringify({ email, code, new_password: newPassword }),
    headers: { 'Content-Type': 'application/json' },
  })
}
