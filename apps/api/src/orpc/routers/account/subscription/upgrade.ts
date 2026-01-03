import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'
import { db, users } from '~/drizzle'
import { env } from '~/env'
import { stripe } from '~/lib/stripe'
import { authMiddleware, orpc } from '~/orpc'

export const upgrade = orpc
  .use(authMiddleware)
  .input(type({
    returnUrl: 'string',
    successUrl: 'string',
    cancelUrl: 'string',
    isYearly: 'boolean?',
  }))
  .handler(async ({ context, input }) => {
    if (!stripe) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Stripe is not configured' })
    }

    const { successUrl, cancelUrl, isYearly } = input

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, context.user.id))
      .limit(1)

    if (!user) {
      throw new ORPCError('NOT_FOUND', { message: 'User not found' })
    }

    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      })
      customerId = customer.id

      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, user.id))
    }

    const priceId = isYearly ? env.STRIPE_ANNUAL_PRICE_ID! : env.STRIPE_MONTH_PRICE_ID!

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        // trial_period_days: 7,
        metadata: {
          userId: user.id,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
      },
    })

    if (!session.url) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create checkout session' })
    }

    return { url: session.url }
  })
