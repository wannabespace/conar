import type Stripe from 'stripe'
import { ORPCError } from '@orpc/server'
import { env } from '~/env'
import { sendEmail } from '~/lib/resend'
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

      await handler(event).catch(async (error) => {
        if (env.ALERTS_EMAIL) {
          await sendEmail({
            to: env.ALERTS_EMAIL,
            subject: `Alert from Stripe: ${event.type}`,
            template: 'Alert',
            props: {
              text: typeof error === 'object' && error !== null ? JSON.stringify(error, Object.getOwnPropertyNames(error), 2) : String(error),
              service: 'Stripe',
            },
          })
        }

        throw error
      })

      context.addLogData({
        stripeEvent: { type: event.type, id: event.id },
      })

      return true
    }
    catch (error) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: error instanceof Error ? error.message : 'Unknown error' })
    }
  })
