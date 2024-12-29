import type Stripe from 'stripe'

export async function subscriptionUpdated(event: Stripe.Event) {
  if (event.type !== 'customer.subscription.updated')
    return undefined

  // await db.update(subscriptions).set({
  //   data: event.data.object,
  //   stripeSubscriptionId: event.data.object.id,
  // }).where(eq(subscriptions.stripeCustomerId, event.data.object.customer as string))
}
