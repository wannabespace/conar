import { db } from '@conar/db'
import { subscriptions } from '@conar/db/schema'
import { eq } from 'drizzle-orm'
import { authMiddleware, orpc } from '~/orpc'

export const list = orpc
  .use(authMiddleware)
  .handler(async ({ context }) => db
    .select({
      id: subscriptions.id,
      plan: subscriptions.plan,
      status: subscriptions.status,
      period: subscriptions.period,
      price: subscriptions.price,
      periodStart: subscriptions.periodStart,
      periodEnd: subscriptions.periodEnd,
      trialStart: subscriptions.trialStart,
      trialEnd: subscriptions.trialEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      cancelAt: subscriptions.cancelAt,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, context.user.id)),
  )
