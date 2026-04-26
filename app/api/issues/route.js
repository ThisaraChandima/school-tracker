import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

// GET - public: anyone can view issues
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const school_id = searchParams.get('school_id')
  let q = supabase.from('issues').select('*').order('created_at', { ascending: false })
  if (school_id) q = q.eq('school_id', Number(school_id))
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST - protected: only logged in users can add
export async function POST(request) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { school_id, text } = await request.json()
  if (!school_id || !text?.trim())
    return NextResponse.json({ error: 'school_id and text required' }, { status: 400 })
  const { data, error } = await supabase
    .from('issues').insert({ school_id: Number(school_id), text: text.trim(), done: false })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
