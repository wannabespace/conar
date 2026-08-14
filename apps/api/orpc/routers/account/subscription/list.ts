import { db } from '@tamery/db'
import { subscriptions } from '@tamery/db/schema'
import { eq } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

export const list = orpc.use(authMiddleware).handler(({ context }) =>
  db
    .select({
      cancelAt: subscriptions.cancelAt,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      id: subscriptions.id,
      period: subscriptions.period,
      periodEnd: subscriptions.periodEnd,
      periodStart: subscriptions.periodStart,
      plan: subscriptions.plan,
      price: subscriptions.price,
      status: subscriptions.status,
      trialEnd: subscriptions.trialEnd,
      trialStart: subscriptions.trialStart,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, context.user.id))
)
