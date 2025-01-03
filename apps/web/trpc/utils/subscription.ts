import { db } from '~/drizzle'

export async function getSubscriptionStatus(userId: string) {
  const subscription = await db.query.subscriptions.findFirst({
    where: (s, { eq }) => eq(s.userId, userId),
  })

  return {
    active: subscription ? subscription.data.status === 'active' || subscription.data.status === 'trialing' || subscription.data.status === 'past_due' : false,
    pastDue: subscription ? subscription.data.status === 'past_due' : false,
    exists: !!subscription,
    status: subscription ? subscription.data.status : null,
  }
}
