import type Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { db, subscriptions } from '~/drizzle'

export async function subscriptionDeleted(event: Stripe.Event) {
  if (event.type !== 'customer.subscription.deleted')
    return

  await db.delete(subscriptions).where(eq(subscriptions.stripeSubscriptionId, event.data.object.id as string))
}
