import { Resend } from 'resend'
import { env } from '~/env'

export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export async function sendEmail(
  email: string,
  subjectLine: string,
  template: string,
) {
  if (!resend) {
    console.error('Resend email service is not configured.', {
      email,
      subjectLine,
      template,
    })
    return
  }

  try {
    const { error } = await resend.emails.send({
      from: `Conar <${env.RESEND_FROM_EMAIL}>`,
      to: email,
      subject: subjectLine,
      html: template,
    })

    if (error) {
      throw error
    }
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : 'Unknown error', error)

    throw new Error('Unknown error occurred while sending email')
  }
}
