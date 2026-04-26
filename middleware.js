import { NextResponse } from 'next/server'

export function middleware(request) {
  // No page-level protection - tracker is public view
  // API write protection is handled in the route handlers themselves
  return NextResponse.next()
}

export const config = {
  matcher: []
}
