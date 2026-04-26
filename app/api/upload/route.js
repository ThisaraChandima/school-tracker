import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthInfo } from '@/lib/auth'

export async function POST(request) {
  const auth = getAuthInfo()
  if (!auth.isAdmin && !auth.isSchool) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const schoolId = formData.get('school_id')

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Check file type
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WEBP allowed' }, { status: 400 })
  }

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const ext = file.name.split('.').pop()
  const filename = `${schoolId}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from('issue-images')
    .upload(filename, buffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from('issue-images').getPublicUrl(filename)
  return NextResponse.json({ url: urlData.publicUrl })
}
