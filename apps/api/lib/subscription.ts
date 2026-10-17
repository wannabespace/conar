import { db } from '@tamery/db'
import { subscriptions } from '@tamery/db/schema'
import { ACTIVE_SUBSCRIPTION_STATUSES } from '@tamery/shared/constants'
import { and, eq, isNotNull } from 'drizzle-orm'

// Conar's subscriptions share this table without a price id; they never grant Tamery's plan.
export const tamerySubscriptions = isNotNull(subscriptions.stripePriceId)

export const getSubscription = async (userId: string) => {
  const userSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), tamerySubscriptions))

  return (
    userSubscriptions.find((s) =>
      ACTIVE_SUBSCRIPTION_STATUSES.includes(
        s.status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number]
      )
    ) ?? null
  )
}
