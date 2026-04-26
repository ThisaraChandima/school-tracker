import { cookies } from 'next/headers'

export function isAuthenticated() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')
  return token?.value === 'authenticated'
}
