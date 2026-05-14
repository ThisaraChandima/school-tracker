import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('issues')
    .select('school_id, done')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const counts = {}
  data.forEach(i => {
    if (!counts[i.school_id]) counts[i.school_id] = { open: 0, done: 0 }
    i.done ? counts[i.school_id].done++ : counts[i.school_id].open++
  })

  return NextResponse.json(counts, {
    headers: { 'Cache-Control': 'no-store' }
  })
}
