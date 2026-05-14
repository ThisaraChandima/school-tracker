import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getAuthInfo } from '@/lib/auth'

// DELETE - remove custom school + all its issues
export async function DELETE(request, { params }) {
  const { isAdmin } = getAuthInfo()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const schoolId = Number(params.id)

  // Delete issues first
  await supabase.from('issues').delete().eq('school_id', schoolId)
  // Delete school account if any
  await supabase.from('school_accounts').delete().eq('school_id', schoolId)
  // Delete school details override if any
  await supabase.from('school_details').delete().eq('school_id', schoolId)
  // Delete custom school record
  const { error } = await supabase.from('custom_schools').delete().eq('id', schoolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
