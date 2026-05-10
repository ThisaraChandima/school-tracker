import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getAuthInfo } from '@/lib/auth'

// POST: bulk operations
// { action: 'grant', school_ids: [...], password: '...' }
// { action: 'revoke', school_ids: [...] }
// { action: 'reset_issues', school_id: ... }
// { action: 'mark_all_done', school_id: ... }
export async function POST(request) {
  const { isAdmin } = getAuthInfo()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { action } = body

  if (action === 'grant') {
    const { school_ids, password, schools_data } = body
    if (!school_ids?.length || !password?.trim())
      return NextResponse.json({ error: 'school_ids and password required' }, { status: 400 })

    const rows = school_ids.map(sid => ({
      school_id: Number(sid),
      school_name: schools_data?.[sid] || String(sid),
      password: password.trim(),
    }))

    const { error } = await supabase
      .from('school_accounts')
      .upsert(rows, { onConflict: 'school_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, count: rows.length })
  }

  if (action === 'revoke') {
    const { school_ids } = body
    if (!school_ids?.length) return NextResponse.json({ error: 'school_ids required' }, { status: 400 })
    const { error } = await supabase.from('school_accounts').delete().in('school_id', school_ids.map(Number))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, count: school_ids.length })
  }

  if (action === 'reset_issues') {
    const { school_id } = body
    if (!school_id) return NextResponse.json({ error: 'school_id required' }, { status: 400 })
    const { error } = await supabase.from('issues').delete().eq('school_id', Number(school_id))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'mark_all_done') {
    const { school_id } = body
    if (!school_id) return NextResponse.json({ error: 'school_id required' }, { status: 400 })
    const { error } = await supabase.from('issues').update({ done: true }).eq('school_id', Number(school_id)).eq('done', false)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'mark_all_open') {
    const { school_id } = body
    if (!school_id) return NextResponse.json({ error: 'school_id required' }, { status: 400 })
    const { error } = await supabase.from('issues').update({ done: false }).eq('school_id', Number(school_id)).eq('done', true)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
