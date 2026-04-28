import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getAuthInfo } from '@/lib/auth'
import SCHOOLS from '@/lib/schools'

export async function GET() {
  const { isAdmin } = getAuthInfo()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: issues, error } = await supabase
    .from('issues').select('*').order('school_id').order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const schoolMap = Object.fromEntries(SCHOOLS.map(s => [s.id, s]))

  const rows = [
    ['School ID', 'School Name', 'Area', 'Type', 'Issue', 'Status', 'Has Image', 'Date'],
    ...issues.map(i => {
      const s = schoolMap[i.school_id] || {}
      return [
        i.school_id,
        s.name || '',
        s.address_en || '',
        s.type || '',
        `"${(i.text || '').replace(/"/g, '""')}"`,
        i.done ? 'Resolved' : 'Open',
        i.image_url ? 'Yes' : 'No',
        new Date(i.created_at).toLocaleDateString('en-GB'),
      ]
    })
  ]

  const csv = rows.map(r => r.join(',')).join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="school-issues-${new Date().toISOString().slice(0,10)}.csv"`,
    }
  })
}
