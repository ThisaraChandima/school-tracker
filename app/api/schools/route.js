import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getAuthInfo } from '@/lib/auth'

// GET all school accounts (admin only)
export async function GET() {
  const { isAdmin } = getAuthInfo()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('school_accounts').select('*').order('school_id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST - create or update school account (admin only)
export async function POST(request) {
  const { isAdmin } = getAuthInfo()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { school_id, school_name, password } = await request.json()
  if (!school_id || !password?.trim()) {
    return NextResponse.json({ error: 'school_id and password required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('school_accounts')
    .upsert({ school_id: Number(school_id), school_name, password: password.trim() }, { onConflict: 'school_id' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE - remove school account (admin only)
export async function DELETE(request) {
  const { isAdmin } = getAuthInfo()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { school_id } = await request.json()
  const { error } = await supabase.from('school_accounts').delete().eq('school_id', Number(school_id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
