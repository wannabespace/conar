import { ORPCError } from '@orpc/server'
import { eq } from 'drizzle-orm'
import { db, users } from '~/drizzle'
import { stripe } from '~/lib/stripe'
import { authMiddleware, orpc } from '~/orpc'

export const invoices = orpc
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const [user] = await db.select().from(users).where(eq(users.id, context.user.id))

    if (!user) {
      throw new ORPCError('NOT_FOUND', { message: 'User not found' })
    }

    if (!user.stripeCustomerId) {
      return []
    }

    const invoices = await stripe?.invoices.list({
      customer: user.stripeCustomerId,
    })

    return invoices?.data.map(invoice => ({
      id: invoice.id,
      amount: invoice.amount_paid,
      status: invoice.status,
      createdAt: new Date(invoice.created * 1000),
      url: invoice.hosted_invoice_url,
    })) ?? []
  })
