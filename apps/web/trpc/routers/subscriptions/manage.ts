import type { subscriptionType } from '~/drizzle'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { env } from '~/env'
import { getStripeCustomerIdByEmail, stripe } from '~/lib/stripe'
import { protectedProcedure } from '~/trpc'
import { isSubscriptionActive } from '~/trpc/utils/subscription'

const plans = {
  monthly: env.STRIPE_MONTHLY_PRICE_ID,
  yearly: env.STRIPE_YEARLY_PRICE_ID,
}

export const manage = protectedProcedure
  .input(z.object({
    type: z.enum(['monthly'] satisfies typeof subscriptionType.enumValues),
  }))
  .mutation(async ({ ctx, input }) => {
    const [isActive, customerId] = await Promise.all([
      isSubscriptionActive(ctx.user.id),
      getStripeCustomerIdByEmail(ctx.user.email),
    ])

    let url: string | null

    if (isActive) {
      if (!customerId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User does not have a Stripe customer ID' })
      }

      const configuration = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${env.NEXT_PUBLIC_URL}/chat`,
      })

      url = configuration.url
    }
    else {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            price: plans[input.type],
            quantity: 1,
          },
        ],
        customer: customerId || undefined,
        customer_email: customerId ? undefined : ctx.user.email,
        success_url: `${env.NEXT_PUBLIC_URL}/chat?subscription=success`,
        cancel_url: `${env.NEXT_PUBLIC_URL}/home`,
      })

      url = session.url
    }

    if (!url) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create billing portal session' })
    }

    return { url }
  })
