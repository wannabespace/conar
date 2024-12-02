// import { redirect } from 'next/navigation'
// import { isSubscriptionActive } from '~/trpc/utils/subscription'

export async function GET(request: Request) {
  // if (userId) {
  //   const token = sessionId
  //   return redirect(`connnect://session?session_token=${token}`)
  // }

  // if (!userId) {
  //   return Response.redirect(new URL('/sign-up', request.url))
  // }

  // const isActive = await isSubscriptionActive(userId)

  return Response.redirect(new URL('/', request.url))
}
