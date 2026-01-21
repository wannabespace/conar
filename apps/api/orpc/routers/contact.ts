import { SUPPORT_EMAIL } from '@conar/shared/constants'
import { type } from 'arktype'
import { consola } from 'consola'
import { resend } from '~/lib/resend'
import { authMiddleware, orpc } from '~/orpc'

export const contact = orpc
  .use(authMiddleware)
  .input(type({
    message: 'string',
  }))
  .handler(async ({ input, context }) => {
    if (!resend) {
      consola.error('Resend is not configured')
      return
    }

    const { data, error } = await resend.batch.send([
      {
        from: 'Conar <conar@conar.app>',
        to: SUPPORT_EMAIL,
        subject: `Contact request from ${context.user.email}`,
        html: `<p>From: ${context.user.email}</p><p>Message:<br>${input.message}</p>`,
      },
      {
        from: 'Conar <conar@conar.app>',
        to: context.user.email,
        subject: 'Your contact request has been received by Conar',
        html: `<p>Hi ${context.user.name || context.user.email},</p><p>This is an automatic reply to let you know we received your message and will answer soon.</p>`,
      },
    ])

    if (error) {
      throw error
    }

    consola.log('Support message sent successfully', data.data)
  })
