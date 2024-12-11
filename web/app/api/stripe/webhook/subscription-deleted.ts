import type Stripe from 'stripe'
// @ts-expect-error subs
import { db, subscriptions } from '@/drizzle'
import { eq } from 'drizzle-orm'

export async function subscriptionDeleted(event: Stripe.Event) {
  if (event.type !== 'customer.subscription.deleted')
    return

  await db.delete(subscriptions).where(eq(subscriptions.stripeSubscriptionId, event.data.object.id as string))
}
