import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'

// This endpoint keeps Supabase active — hit it daily via cron-job.org
// URL: https://mavanella-zone.vercel.app/api/ping
export async function GET() {
  try {
    const { count, error } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })

    if (error) throw error

    return NextResponse.json({
      status: 'ok',
      message: 'Database is active',
      issues_count: count,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json({
      status: 'error',
      message: e.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
