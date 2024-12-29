import type Stripe from 'stripe'
import { createLogger } from '~/lib/logger'
import { subscriptionCreated } from './subscription-created'
import { subscriptionDeleted } from './subscription-deleted'
import { subscriptionUpdated } from './subscription-updated'
import { validateRequest, validateSubscriptionPrices } from './validate'

const logger = createLogger('stripe.webhook')

export async function POST(request: Request) {
  const event = await validateRequest(request)

  if (!event)
    return Response.json({ error: 'Webhook signature verification failed.' }, { status: 403 })

  if (!validateSubscriptionPrices(event))
    return Response.json({ error: 'Invalid subscription price.' }, { status: 400 })

  const eventMap = new Map<Stripe.Event.Type, (event: Stripe.Event) => Promise<void>>([
    ['customer.subscription.created', subscriptionCreated],
    ['customer.subscription.deleted', subscriptionDeleted],
    ['customer.subscription.updated', subscriptionUpdated],
  ])

  const handler = eventMap.get(event.type)

  if (!handler)
    return Response.json({ error: 'Stripe event not found' }, { status: 404 })

  await handler(event)

  logger.success(`Stripe event ${event.type} handled`, { event })

  return Response.json({ message: 'Stripe event handled' })
}
