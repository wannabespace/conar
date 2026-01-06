import type Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { db, subscriptions } from '~/drizzle'
import { env } from '~/env'

export async function subscriptionDeleted(event: Stripe.Event) {
  if (event.type !== 'customer.subscription.deleted')
    return

  const subscription = event.data.object

  const [existing] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
    .limit(1)

  if (!existing) {
    throw new Error(`Subscription ${subscription.id} not found in database`)
  }

  const period = subscription.items.data[0]?.price.id === env.STRIPE_ANNUAL_PRICE_ID ? 'yearly' : 'monthly'
  const periodStart = subscription.items.data[0]?.current_period_start ? new Date(subscription.items.data[0].current_period_start * 1000) : null
  const periodEnd = subscription.items.data[0]?.current_period_end ? new Date(subscription.items.data[0].current_period_end * 1000) : null

  await db
    .update(subscriptions)
    .set({
      status: subscription.status,
      periodStart,
      periodEnd,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      period,
    })
    .where(eq(subscriptions.id, existing.id))
}
