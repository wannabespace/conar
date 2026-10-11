import { ORPCError } from '@orpc/server'
import { SUPPORT_EMAIL } from '@tamery/shared/constants'
import { type } from 'arktype'

import { redis } from '~/lib/redis'
import { resend } from '~/lib/resend'
import { optionalAuthMiddleware, orpc } from '~/orpc'

const REQUESTS_PER_HOUR = 5
const HOUR_SECONDS = 60 * 60

// Public and unauthenticated: it only ever mails SUPPORT_EMAIL (never the submitted address, or it becomes a relay) and is capped per IP.
export const contactSales = orpc
  .use(optionalAuthMiddleware)
  .input(
    type({
      email: 'string.email <= 254',
      message: '0 < string <= 4000',
    })
  )
  .handler(async ({ input, context }) => {
    const ip =
      context.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const key = `contact-sales:${ip}`
    const [count] = await redis
      .multi()
      .incr(key)
      .expire(key, HOUR_SECONDS)
      .exec()
    if (Number(count) > REQUESTS_PER_HOUR) {
      throw new ORPCError('TOO_MANY_REQUESTS', {
        message: 'Too many messages. Please try again later.',
      })
    }

    if (!resend) {
      context.addLogData({ warning: 'Resend is not configured' })
      return
    }

    const { error } = await resend.emails.send({
      from: 'Tamery <tamery@tamery.app>',
      html: `<p>From: ${Bun.escapeHTML(input.email)}</p><p>${Bun.escapeHTML(input.message).replaceAll('\n', '<br>')}</p>`,
      replyTo: input.email,
      subject: `Enterprise request from ${input.email}`,
      to: SUPPORT_EMAIL,
    })

    if (error) {
      throw error
    }
  })
