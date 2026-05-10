import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import supabase from '@/lib/supabase'

// GET - check auth status
export async function GET() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return NextResponse.json({ loggedIn: false, role: 'guest' })

  if (token === 'admin' || token === 'authenticated') {
    return NextResponse.json({ loggedIn: true, role: 'admin' })
  }

  if (token.startsWith('school:')) {
    const schoolId = parseInt(token.split(':')[1])
    return NextResponse.json({ loggedIn: true, role: 'school', schoolId })
  }

  return NextResponse.json({ loggedIn: false, role: 'guest' })
}

// POST - login (admin or school)
export async function POST(request) {
  const { type, password, schoolId } = await request.json()

  // Admin login
  if (type === 'admin' || !type) {
    if (password === process.env.ADMIN_PASSWORD) {
      const res = NextResponse.json({ success: true, role: 'admin' })
      res.cookies.set('auth_token', 'admin', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      })
      return res
    }
    return NextResponse.json({ error: 'වැරදි මුරපදය' }, { status: 401 })
  }

  // School login
  if (type === 'school') {
    if (!schoolId || !password) {
      return NextResponse.json({ error: 'School and password required' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('school_accounts')
      .select('*')
      .eq('school_id', Number(schoolId))
      .eq('password', password)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'වැරදි මුරපදය හෝ ගිණුම නොමැත' }, { status: 401 })
    }

    const res = NextResponse.json({ success: true, role: 'school', schoolId: data.school_id })
    res.cookies.set('auth_token', `school:${data.school_id}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })
    return res
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}

// DELETE - logout
export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set('auth_token', '', { maxAge: 0 })
  return res
}
