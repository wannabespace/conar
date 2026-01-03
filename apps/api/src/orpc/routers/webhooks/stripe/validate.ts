import type Stripe from 'stripe'
import { env } from '~/env'
import { stripe } from '~/lib/stripe'

const PRICE_IDS = [env.STRIPE_MONTH_PRICE_ID!, env.STRIPE_ANNUAL_PRICE_ID!]

export async function validateRequest(request: Request): Promise<Stripe.Event> {
  const signature = request.headers.get('stripe-signature')

  if (!signature || !stripe)
    throw new Error('No signature found in request')

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      env.STRIPE_WEBHOOK_SECRET!,
    )
  }
  catch {
    throw new Error('Failed to validate request')
  }

  return event
}

export function validateSubscriptionPrices(event: Stripe.Event) {
  if (!event.type.startsWith('customer.subscription.'))
    return

  const subscription = event.data.object

  if (subscription.object !== 'subscription') {
    throw new Error('Invalid subscription object type')
  }

  const priceId = subscription.items.data[0]?.price.id

  if (!priceId) {
    throw new Error('No price ID found in subscription')
  }

  if (!PRICE_IDS.includes(priceId)) {
    throw new Error('Invalid subscription price')
  }
}
