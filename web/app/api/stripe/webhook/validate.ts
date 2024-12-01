import type Stripe from 'stripe'
import { headers } from 'next/headers'
import { env } from '~/env'
import { stripe } from '~/lib/stripe'

const PRICE_IDS = [env.STRIPE_MONTHLY_PRICE_ID, env.STRIPE_YEARLY_PRICE_ID]

export async function validateRequest(request: Request) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature)
    return null

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    )
  }
  catch {
    return null
  }

  return event
}

export function validateSubscriptionPrices(event: Stripe.Event) {
  if (!event.type.startsWith('customer.subscription.'))
    return true

  const subscription = event.data.object as Stripe.Subscription
  const priceId = subscription.items.data[0]?.price.id

  return PRICE_IDS.includes(priceId)
}
