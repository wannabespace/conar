import { headers } from 'next/headers'
import { auth } from '~/lib/auth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const key = url.searchParams.get('key')
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    return Response.redirect(
      `connnect://session?key=${key}&token=${session.session.token}`,
    )
  }

  return Response.redirect(new URL('/sign-up', request.url))
}
