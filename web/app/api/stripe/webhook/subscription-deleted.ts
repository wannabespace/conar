import type Stripe from 'stripe'

export async function subscriptionDeleted(event: Stripe.Event) {
  if (event.type !== 'customer.subscription.deleted')
    return undefined

  // await db.delete(subscriptions).where(eq(subscriptions.stripeSubscriptionId, event.data.object.id as string))
}
