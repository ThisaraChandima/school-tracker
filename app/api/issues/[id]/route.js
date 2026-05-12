import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getAuthInfo } from '@/lib/auth'

export async function PATCH(request, { params }) {
  const auth = getAuthInfo()
  const body = await request.json()
  const { data: issue } = await supabase.from('issues').select('school_id').eq('id', Number(params.id)).single()
  if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!auth.isAdmin && !(auth.isSchool && auth.schoolId === issue.school_id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data, error } = await supabase
    .from('issues').update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', Number(params.id)).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request, { params }) {
  const auth = getAuthInfo()
  const { data: issue } = await supabase.from('issues').select('school_id').eq('id', Number(params.id)).single()
  if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!auth.isAdmin && !(auth.isSchool && auth.schoolId === issue.school_id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { error } = await supabase.from('issues').delete().eq('id', Number(params.id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
