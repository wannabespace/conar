import type { User } from 'better-auth'
import {
  generateResetLink,
  sendEmailIfValid,
} from '~/lib/email/helpers'
import resetPasswordTemplate from '~/lib/email/templates/reset-password'

export async function sendResetPasswordEmail({ user, token }: { user: User, token: string }) {
  const { name, email } = user

  const resetLink = generateResetLink(token)
  const subjectLine = 'Reset Your Conar Password'
  const template = resetPasswordTemplate(name || email, resetLink)

  await sendEmailIfValid(email, subjectLine, template)
}
