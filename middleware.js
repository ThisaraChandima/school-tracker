import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  // Protect /tracker routes
  if (pathname.startsWith('/tracker')) {
    const auth = request.cookies.get('auth_token')
    if (!auth || auth.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/tracker/:path*']
}
