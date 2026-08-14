import { env } from '~/env'
import { sendEmail } from '~/lib/resend'
import { orpc } from '~/orpc'

export const railway = orpc.handler(async ({ context }) => {
  if (!env.ALERTS_EMAIL) {
    context.addLogData({ warning: 'ALERTS_EMAIL is not set' })
    return
  }

  await sendEmail({
    props: {
      service: 'Railway',
      text: JSON.stringify(await context.request.json(), null, 2),
    },
    subject: 'Alert from Railway',
    template: 'Alert',
    to: env.ALERTS_EMAIL,
  })
})
