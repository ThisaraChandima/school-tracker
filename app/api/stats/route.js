import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase.from('issues').select('school_id, done')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const total = data.length
  const open = data.filter(i => !i.done).length
  const done = data.filter(i => i.done).length
  const schoolsWithIssues = new Set(data.map(i => i.school_id)).size
  const schoolsAllDone = Object.entries(
    data.reduce((acc, i) => {
      if (!acc[i.school_id]) acc[i.school_id] = { open: 0, done: 0 }
      i.done ? acc[i.school_id].done++ : acc[i.school_id].open++
      return acc
    }, {})
  ).filter(([, c]) => c.open === 0 && c.done > 0).length

  return NextResponse.json({ total, open, done, schoolsWithIssues, schoolsAllDone })
}
