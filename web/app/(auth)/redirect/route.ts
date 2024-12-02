import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const cookieStore = await cookies()

  const token = cookieStore.get('connnect.bearer_token')

  if (token) {
    return redirect(`connnect://session?token=${token}`)
  }

  if (!token) {
    return Response.redirect(new URL('/sign-up', request.url))
  }

  return Response.redirect(new URL('/', request.url))
}
