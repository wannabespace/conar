import type Stripe from 'stripe'
import { db, subscriptions } from '~/drizzle'
import { clerkClient } from '~/lib/clerk'
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

  const customers = await clerkClient.users.getUserList({
    emailAddress: [stripeResponse.email],
  })

  if (!customers.data[0] || !customers.data[0].id) {
    logger.error('User not found', stripeResponse)
    return
  }

  const userId = customers.data[0].id

  await db.insert(subscriptions).values({
    userId,
    stripeCustomerId: event.data.object.customer as string,
    stripeSubscriptionId: event.data.object.id as string,
    data: event.data.object,
    createdAt: new Date(event.data.object.created * 1000).toISOString(),
    type: event.data.object.items.data[0].plan.interval === 'month' ? 'monthly' : 'yearly',
  })
}
