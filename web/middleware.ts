import type { Session } from 'better-auth/types'
import { betterFetch } from '@better-fetch/fetch'
import { type NextRequest, NextResponse } from 'next/server'

export default async function authMiddleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>(
    '/api/auth/get-session',
    {
      baseURL: request.nextUrl.origin,
      headers: {
        // get the cookie from the request
        cookie: request.headers.get('cookie') || '',
      },
    },
  )

  if (!session) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/profile'],
}
