import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const response = await auth.api.getSession({
    headers: await headers(),
    asResponse: true,
  })
  const token = response.headers.get('set-auth-token')

  if (token) {
    return Response.redirect(
      `connnect://session?token=${token}`,
    )
  }

  return Response.redirect(new URL('/sign-up', request.url))
}
