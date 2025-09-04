import { SUPPORT_EMAIL } from '@conar/shared/constants'
import { type } from 'arktype'
import { resend } from '~/lib/resend'
import { authMiddleware, orpc } from '~/orpc'

export const contact = orpc
  .use(authMiddleware)
  .input(type({
    message: 'string',
  }))
  .handler(async ({ input, context }) => {
    if (!resend) {
      console.error('Resend is not configured')
      return
    }

    const { data, error } = await resend.emails.send({
      from: 'Conar <conar@conar.app>',
      to: SUPPORT_EMAIL,
      subject: `Support request from ${context.user.email}`,
      html: `<p>From: ${context.user.email}</p><p>Message:<br>${input.message}</p>`,
    })

    if (error) {
      throw error
    }

    console.log('Support message sent successfully', data)
  })
