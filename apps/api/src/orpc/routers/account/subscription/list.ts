import { pick } from '@conar/shared/utils/helpers'
import { eq } from 'drizzle-orm'
import { db, subscriptions } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const list = orpc
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, context.user.id))

    return userSubscriptions.map(sub => pick(sub, [
      'id',
      'plan',
      'status',
      'periodStart',
      'periodEnd',
      'trialStart',
      'trialEnd',
      'cancelAtPeriodEnd',
    ]))
  })
