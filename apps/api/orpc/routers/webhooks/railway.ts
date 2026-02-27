import { env } from '~/env'
import { sendEmail } from '~/lib/resend'
import { orpc } from '~/orpc'

export const railway = orpc.handler(async ({ context }) => {
  if (!env.ALERTS_EMAIL) {
    context.addLogData({ warning: 'ALERTS_EMAIL is not set' })
    return
  }

  await sendEmail({
    to: env.ALERTS_EMAIL,
    subject: 'Alert from Railway',
    template: 'Alert',
    props: {
      text: JSON.stringify(await context.request.json(), null, 2),
      service: 'Railway',
    },
  })
})
