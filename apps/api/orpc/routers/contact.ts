import { SUPPORT_EMAIL } from '@tamery/shared/constants'
import { type } from 'arktype'

import { resend } from '~/lib/resend'
import { authMiddleware, orpc } from '~/orpc'

export const contact = orpc
  .use(authMiddleware)
  .input(
    type({
      message: 'string',
    })
  )
  .handler(async ({ input, context }) => {
    if (!resend) {
      context.addLogData({ warning: 'Resend is not configured' })
      return
    }

    const { data, error } = await resend.batch.send([
      {
        from: 'Tamery <tamery@tamery.app>',
        html: `<p>From: ${context.user.email}</p><p>Message:<br>${input.message}</p>`,
        subject: `Contact request from ${context.user.email}`,
        to: SUPPORT_EMAIL,
      },
      {
        from: 'Tamery <tamery@tamery.app>',
        html: `<p>Hi ${context.user.name || context.user.email},</p><p>This is an automatic reply to let you know we received your message and will answer soon.</p>`,
        subject: 'Your contact request has been received by Tamery',
        to: context.user.email,
      },
    ])

    if (error) {
      throw error
    }

    context.addLogData({
      emailData: data.data,
      emailSent: true,
    })
  })
