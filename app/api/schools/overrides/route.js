import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase.from('school_overrides').select('*')
  if (error) return NextResponse.json([])
  return NextResponse.json(data || [])
}
