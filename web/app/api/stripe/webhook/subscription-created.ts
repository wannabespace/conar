import type Stripe from 'stripe'
// @ts-expect-error subscription not exists
import { db, subscriptions } from '~/drizzle'
import { createLogger } from '~/lib/logger'
import { stripe } from '~/lib/stripe'

const logger = createLogger('stripe.webhook.subscription-created')

export async function subscriptionCreated(event: Stripe.Event) {
  if (event.type !== 'customer.subscription.created')
    return

  const stripeResponse = await stripe.customers.retrieve(event.data.object.customer as string)

  if (stripeResponse.deleted) {
    logger.error('User deleted', stripeResponse)
    return
  }

  if (!stripeResponse.email) {
    logger.error('User email not found', stripeResponse)
    return
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, stripeResponse.email!),
  })

  if (!user) {
    logger.error('User not found', stripeResponse)
    return
  }

  await db.insert(subscriptions).values({
    userId: user.id,
    stripeCustomerId: event.data.object.customer as string,
    stripeSubscriptionId: event.data.object.id as string,
    data: event.data.object,
    createdAt: new Date(event.data.object.created * 1000).toISOString(),
    type: event.data.object.items.data[0].plan.interval === 'month' ? 'monthly' : 'yearly',
  })
}
