import { Resend } from 'resend'
import { env } from '~/env'

export class ResendEmailService {
  async sendEmail(email: string, subjectLine: string, template: string) {
    const resend = new Resend(env.RESEND_API_KEY!)
    const fromEmail = env.RESEND_FROM_EMAIL!

    try {
      const response = await resend.emails.send({
        from: `Conar <${fromEmail}>`,
        to: email,
        subject: subjectLine,
        html: template,
      })

      if (!response?.data) {
        throw new Error('Failed to send email: No response from email service')
      }
    }
    catch (error) {
      console.error('Email sending failed:', error instanceof Error ? error.message : 'Unknown error')
      throw error instanceof Error
        ? error
        : new Error('Unknown error occurred while sending email')
    }
  }
}
