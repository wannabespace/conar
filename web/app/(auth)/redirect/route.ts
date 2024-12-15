import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const token = await auth.api.getSessionToken({
    headers: await headers(),
  })

  if (token) {
    return Response.redirect(
      `connnect://session?token=${encodeURIComponent(token)}`,
    )
  }

  return Response.redirect(new URL('/sign-up', request.url))
}
