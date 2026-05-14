import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'

export const revalidate = 0  // Never cache - always fresh

export async function GET() {
  const { data, error } = await supabase
    .from('issues')
    .select('school_id, done')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const total = data.length
  const done  = data.filter(i => i.done).length
  const open  = total - done

  const bySchool = {}
  data.forEach(i => {
    if (!bySchool[i.school_id]) bySchool[i.school_id] = { open: 0, done: 0 }
    i.done ? bySchool[i.school_id].done++ : bySchool[i.school_id].open++
  })

  const schoolsWithIssues = Object.keys(bySchool).length
  const schoolsAllDone = Object.values(bySchool)
    .filter(c => c.open === 0 && c.done > 0).length

  return NextResponse.json(
    { total, open, done, schoolsWithIssues, schoolsAllDone },
    { headers: { 'Cache-Control': 'no-store' } }  // Always live data
  )
}
