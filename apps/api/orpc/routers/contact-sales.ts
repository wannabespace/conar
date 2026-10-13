import { ratelimit } from '@orpc/ratelimit'
import { RedisRateLimiter } from '@orpc/ratelimit/redis'
import { SUPPORT_EMAIL } from '@tamery/shared/constants'
import { type } from 'arktype'

import { redis } from '~/lib/redis'
import { resend } from '~/lib/resend'
import { optionalAuthMiddleware, orpc } from '~/orpc'

const limiter = new RedisRateLimiter(redis, {
  maxRequests: 5,
  prefix: 'contact-sales:',
  window: 60 * 60 * 1000,
})

// Public and unauthenticated: it only ever mails SUPPORT_EMAIL (never the submitted address, or it becomes a relay) and is capped per IP.
export const contactSales = orpc
  .use(optionalAuthMiddleware)
  .use(
    ratelimit({
      // Railway's edge sets X-Real-IP to the client address on every request; any other client-IP header is only as trustworthy as the hop that wrote it
      key: ({ context }) => context.headers.get('x-real-ip') ?? 'unknown',
      limiter,
    })
  )
  .input(
    type({
      email: 'string.email <= 254',
      message: '0 < string <= 4000',
    })
  )
  .handler(async ({ input, context }) => {
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
