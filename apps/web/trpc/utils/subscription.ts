import { db } from '~/drizzle'

export async function isSubscriptionActive(userId: string) {
  const subscription = await db.query.subscriptions.findFirst({
    where: (s, { eq }) => eq(s.userId, userId),
  })

  if (!subscription) {
    return false
  }

  return subscription.data.status === 'active' || subscription.data.status === 'trialing'
}
