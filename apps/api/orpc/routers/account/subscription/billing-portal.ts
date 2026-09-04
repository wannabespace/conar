import { db } from '@tamery/db'
import { users } from '@tamery/db/schema'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'

import { stripe } from '~/lib/stripe'
import { authMiddleware, orpc } from '~/orpc'

export const billingPortal = orpc
  .use(authMiddleware)
  .input(
    type({
      returnUrl: 'string',
    })
  )
  .errors({
    INTERNAL_SERVER_ERROR: { message: 'Stripe is not configured' },
    NOT_FOUND: { message: 'No customer found' },
  })
  .handler(async ({ context, errors, input }) => {
    if (!stripe) {
      throw errors.INTERNAL_SERVER_ERROR()
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, context.user.id))
      .limit(1)

    if (!user?.stripeCustomerId) {
      throw errors.NOT_FOUND()
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: input.returnUrl,
    })

    return { url: portalSession.url }
  })
