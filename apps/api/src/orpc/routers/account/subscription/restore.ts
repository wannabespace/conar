import { ORPCError } from '@orpc/server'
import { and, eq } from 'drizzle-orm'
import { db, subscriptions } from '~/drizzle'
import { stripe } from '~/lib/stripe'
import { authMiddleware, orpc } from '~/orpc'

export const restore = orpc
  .use(authMiddleware)
  .handler(async ({ context }) => {
    if (!stripe) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Stripe is not configured' })
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, context.user.id),
          eq(subscriptions.cancelAtPeriodEnd, true),
        ),
      )
      .limit(1)

    if (!subscription) {
      throw new ORPCError('NOT_FOUND', { message: 'No subscription scheduled for cancellation found' })
    }

    if (!subscription.stripeSubscriptionId) {
      throw new ORPCError('BAD_REQUEST', { message: 'Subscription is not linked to Stripe' })
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    })

    await db
      .update(subscriptions)
      .set({ cancelAtPeriodEnd: false })
      .where(eq(subscriptions.id, subscription.id))

    return { success: true }
  })
