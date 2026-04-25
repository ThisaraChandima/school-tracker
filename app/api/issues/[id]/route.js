import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'

export async function PATCH(request, { params }) {
  const body = await request.json()
  const { data, error } = await supabase
    .from('issues').update(body).eq('id', Number(params.id)).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request, { params }) {
  const { error } = await supabase.from('issues').delete().eq('id', Number(params.id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
