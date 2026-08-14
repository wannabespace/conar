import type Stripe from 'stripe'

import { env } from '~/env'
import { stripe } from '~/lib/stripe'

export const validateRequest = async (
  request: Request
): Promise<Stripe.Event> => {
  const signature = request.headers.get('stripe-signature')

  if (!signature || !stripe) {
    throw new Error('No signature found in request')
  }

  let event: Stripe.Event

  const webhookSecret = env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }

  try {
    event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      webhookSecret
    )
  } catch {
    throw new Error('Failed to validate request')
  }

  return event
}
