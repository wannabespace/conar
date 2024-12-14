import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const token = await auth.api.getActiveToken({
    headers: await headers(),
  })

  if (token) {
    return Response.redirect(
      `connnect://session?token=${token}`,
    )
  }

  return Response.redirect(new URL('/sign-up', request.url))
}
