import { db } from '@tamery/db'
import { subscriptions } from '@tamery/db/schema'
import { ACTIVE_SUBSCRIPTION_STATUSES } from '@tamery/shared/constants'
import { eq } from 'drizzle-orm'

export async function getSubscription(userId: string) {
  const userSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))

  return (
    userSubscriptions.find(s =>
      ACTIVE_SUBSCRIPTION_STATUSES.includes(
        s.status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number],
      ),
    ) ?? null
  )
}
