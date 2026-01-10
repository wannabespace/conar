import type Stripe from 'stripe'
import { consola } from 'consola'
import { eq } from 'drizzle-orm'
import { v7 } from 'uuid'
import { db, subscriptions, users } from '~/drizzle'
import { env } from '~/env'

export async function subscriptionCreated(event: Stripe.Event) {
  if (event.type !== 'customer.subscription.created')
    return

  const subscription = event.data.object

  const userId = subscription.metadata?.userId

  if (!userId) {
    throw new Error('No userId found in subscription metadata')
  }

  consola.info('Stripe subscription created', { subscription: JSON.stringify(subscription) })

  const [existing] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
    .limit(1)

  const period = subscription.items.data[0]?.price.id === env.STRIPE_ANNUAL_PRICE_ID ? 'yearly' : 'monthly'
  const price = subscription.items.data[0]?.price.unit_amount ? subscription.items.data[0].price.unit_amount / 100 : 0
  const periodStart = subscription.items.data[0]?.current_period_start ? new Date(subscription.items.data[0].current_period_start * 1000) : null
  const periodEnd = subscription.items.data[0]?.current_period_end ? new Date(subscription.items.data[0].current_period_end * 1000) : null

  const subscriptionData = {
    plan: 'pro',
    userId,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    periodStart,
    periodEnd,
    trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
    period,
    price,
  } satisfies typeof subscriptions.$inferInsert

  if (existing) {
    await db
      .update(subscriptions)
      .set(subscriptionData)
      .where(eq(subscriptions.id, existing.id))
  }
  else {
    await db.insert(subscriptions).values({
      id: v7(),
      ...subscriptionData,
    })
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (user && !user.stripeCustomerId) {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
  }
}
