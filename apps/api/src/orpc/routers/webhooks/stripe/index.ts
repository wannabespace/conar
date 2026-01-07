import type Stripe from 'stripe'
import { ORPCError } from '@orpc/server'
import { consola } from 'consola'
import { orpc } from '~/orpc'
import { subscriptionCreated } from './subscription-created'
import { subscriptionDeleted } from './subscription-deleted'
import { subscriptionUpdated } from './subscription-updated'
import { validateRequest } from './validate'

const eventMap = new Map<Stripe.Event.Type, (event: Stripe.Event) => Promise<void>>([
  ['customer.subscription.created', subscriptionCreated],
  ['customer.subscription.deleted', subscriptionDeleted],
  ['customer.subscription.updated', subscriptionUpdated],
])

export const stripe = orpc
  .handler(async ({ context }) => {
    try {
      const event = await validateRequest(context.request)

      const handler = eventMap.get(event.type)

      if (!handler) {
        throw new ORPCError('BAD_REQUEST', { message: 'Stripe event not found' })
      }

      await handler(event)

      consola.success(`Stripe event ${event.type} handled`, { event: { id: event.id } })

      return true
    }
    catch (error) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: error instanceof Error ? error.message : 'Unknown error' })
    }
  })
