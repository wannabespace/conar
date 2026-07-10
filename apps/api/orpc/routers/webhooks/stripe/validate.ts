import type Stripe from 'stripe'
import { env } from '~/env'
import { stripe } from '~/lib/stripe'

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
