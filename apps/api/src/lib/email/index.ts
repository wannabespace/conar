import type { ComponentProps } from 'react'
import { consola } from 'consola'
import { Resend } from 'resend'
import { env } from '~/env'
import { OnPasswordReset, ResetPassword } from '~/lib/email/templates'

export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

const templates = {
  ResetPassword,
  OnPasswordReset,
} as const

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
    consola.error('Resend email service is not configured.', {
      to,
      subject,
      template,
    })
    return
  }

  try {
    const Template = templates[template] as (props?: P) => React.ReactElement
    const { error } = await resend.emails.send({
      from: `Conar <${env.RESEND_FROM_EMAIL}>`,
      to,
      subject,
      react: Template(props),
    })

    if (error) {
      throw error
    }
  }
  catch (error) {
    consola.error(error instanceof Error ? error.message : 'Unknown error', error)

    throw new Error('Unknown error occurred while sending email')
  }
}
