import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getAuthInfo } from '@/lib/auth'

// GET all overrides, or ?school_id=xxx for one
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const school_id = searchParams.get('school_id')

  let q = supabase.from('school_overrides').select('*')
  if (school_id) q = q.eq('school_id', Number(school_id)).single()

  const { data, error } = await q
  if (error && error.code !== 'PGRST116') // PGRST116 = row not found (ok)
    return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || null)
}

// POST - upsert override for a school (admin only)
export async function POST(request) {
  const { isAdmin } = getAuthInfo()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { school_id, ...fields } = body

  if (!school_id) return NextResponse.json({ error: 'school_id required' }, { status: 400 })

  // Remove empty strings → null
  const cleaned = Object.fromEntries(
    Object.entries(fields).map(([k, v]) => [k, v === '' ? null : v])
  )

  const { data, error } = await supabase
    .from('school_overrides')
    .upsert({ school_id: Number(school_id), ...cleaned, updated_at: new Date().toISOString() }, { onConflict: 'school_id' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE - remove override (restore to original)
export async function DELETE(request) {
  const { isAdmin } = getAuthInfo()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { school_id } = await request.json()
  const { error } = await supabase.from('school_overrides').delete().eq('school_id', Number(school_id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
