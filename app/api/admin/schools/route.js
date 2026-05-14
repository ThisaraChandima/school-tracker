import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getAuthInfo } from '@/lib/auth'

// GET all custom schools (ones added via admin, not in Excel)
export async function GET() {
  const { isAdmin } = getAuthInfo()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('custom_schools')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST - add new school
export async function POST(request) {
  const { isAdmin } = getAuthInfo()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, name, address, address_en, type, medium, principal, students_m, students_f, teachers, classification } = body

  if (!id || !name?.trim()) {
    return NextResponse.json({ error: 'School ID and name are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('custom_schools')
    .insert({
      id: Number(id),
      name: name.trim(),
      address: address?.trim() || '',
      address_en: address_en?.trim() || '',
      type: type?.trim() || '',
      medium: medium?.trim() || 'Sinhala',
      principal: principal?.trim() || '',
      students_m: Number(students_m) || 0,
      students_f: Number(students_f) || 0,
      teachers: Number(teachers) || 0,
      classification: classification?.trim() || '',
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
