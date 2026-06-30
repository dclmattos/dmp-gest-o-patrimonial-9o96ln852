import pb from '@/lib/pocketbase/client'

export const requestOtp = async (email: string) => {
  return await pb.send('/backend/v1/otp/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const verifyOtp = async (email: string, code: string) => {
  return await pb.send('/backend/v1/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
    headers: { 'Content-Type': 'application/json' },
  })
}
