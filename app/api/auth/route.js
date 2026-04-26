import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// GET - check if logged in
export async function GET() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')
  const loggedIn = token?.value === 'authenticated'
  return NextResponse.json({ loggedIn })
}

// POST - login
export async function POST(request) {
  const { password } = await request.json()
  if (password === process.env.ADMIN_PASSWORD) {
    const res = NextResponse.json({ success: true })
    res.cookies.set('auth_token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    return res
  }
  return NextResponse.json({ error: 'වැරදි මුරපදය' }, { status: 401 })
}

// DELETE - logout
export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set('auth_token', '', { maxAge: 0 })
  return res
}
