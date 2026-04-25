import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'

// PATCH /api/issues/:id  body: { done: true/false }
export async function PATCH(request, { params }) {
  const { id } = params
  const body = await request.json()

  const { data, error } = await supabase
    .from('issues')
    .update(body)
    .eq('id', Number(id))
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/issues/:id
export async function DELETE(request, { params }) {
  const { id } = params
  const { error } = await supabase.from('issues').delete().eq('id', Number(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
