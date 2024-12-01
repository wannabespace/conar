import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
// import { isSubscriptionActive } from '~/trpc/utils/subscription'

export async function GET(request: Request) {
  const { userId, sessionId } = await auth()

  if (userId) {
    return redirect(`connnect://session_id=${sessionId}`)
  }

  // if (!userId) {
  //   return Response.redirect(new URL('/sign-up', request.url))
  // }

  // const isActive = await isSubscriptionActive(userId)

  return Response.redirect(new URL('/', request.url))
}
