import consola from 'consola'
import { env } from '~/env'
import { sendEmail } from '~/lib/email'
import { orpc } from '~/orpc'

export const railway = orpc.handler(async ({ context }) => {
  if (!env.ALERTS_EMAIL) {
    consola.error('ALERTS_EMAIL is not set')
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
