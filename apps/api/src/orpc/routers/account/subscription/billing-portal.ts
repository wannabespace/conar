import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'
import { db, users } from '~/drizzle'
import { stripe } from '~/lib/stripe'
import { authMiddleware, orpc } from '~/orpc'

export const billingPortal = orpc
  .use(authMiddleware)
  .input(type({
    returnUrl: 'string',
  }))
  .handler(async ({ context, input }) => {
    if (!stripe) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Stripe is not configured' })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, context.user.id))
      .limit(1)

    if (!user?.stripeCustomerId) {
      throw new ORPCError('NOT_FOUND', { message: 'No customer found' })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: input.returnUrl,
    })

    return { url: portalSession.url }
  })
