import type { ComponentProps } from 'react'
import type { CreateEmailOptions } from 'resend'
import { Resend } from 'resend'
import { env } from '~/env'
import { redisMemoize } from '../redis'
import * as templates from './templates'

export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export async function sendEmail<
  T extends keyof typeof templates,
  P extends ComponentProps<typeof templates[T]>,
>({
  to,
  subject,
  template,
  props,
}: {
  to: string
  subject: string
  template: T
} & (keyof P extends never
  ? { props?: never }
  : { props: P })) {
  if (!resend) {
    console.error('Resend email service is not configured.', {
      to,
      subject,
      template,
    })
    return
  }

  const Template = templates[template] as (props?: P) => React.ReactElement
  const options: CreateEmailOptions = {
    from: `Conar <${env.RESEND_FROM_EMAIL}>`,
    to,
    subject,
    react: Template(props),
  }

  await redisMemoize(async () => {
    try {
      const { error } = await resend.emails.send(options)

      if (error) {
        throw error
      }
    }
    catch (error) {
      console.error('Resend email service error:', error instanceof Error ? error.message : 'Unknown error', error)
    }
  }, `resend:${JSON.stringify(options)}`, 10 * 60)
}
