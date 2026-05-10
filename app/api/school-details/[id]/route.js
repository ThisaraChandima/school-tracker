import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getAuthInfo } from '@/lib/auth'

// GET single school override
export async function GET(request, { params }) {
  const { data, error } = await supabase
    .from('school_details').select('*').eq('school_id', Number(params.id)).single()
  if (error && error.code !== 'PGRST116')
    return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || null)
}

// PUT - upsert school details (admin only)
export async function PUT(request, { params }) {
  const { isAdmin } = getAuthInfo()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { principal, type, medium, students_m, students_f, teachers, classification } = body

  const { data, error } = await supabase
    .from('school_details')
    .upsert({
      school_id: Number(params.id),
      principal: principal?.trim() || null,
      type: type?.trim() || null,
      medium: medium?.trim() || null,
      students_m: Number(students_m) || 0,
      students_f: Number(students_f) || 0,
      teachers: Number(teachers) || 0,
      classification: classification?.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'school_id' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE - reset to original Excel data (admin only)
export async function DELETE(request, { params }) {
  const { isAdmin } = getAuthInfo()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('school_details').delete().eq('school_id', Number(params.id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
