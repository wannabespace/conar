import type { User } from 'better-auth'
import {
  generateResetLink,
  sendEmailIfValid,
  validateResetToken,
} from '~/lib/email/helpers'
import resetPasswordTemplate from '~/lib/email/templates/reset-password'

interface ResetPasswordEmailData {
  user: User
  token: string
}

/**
 * Send password reset email to user
 * @param data - User data and reset token
 */
export async function sendResetPasswordEmail({ user, token }: ResetPasswordEmailData) {
  validateResetToken(token)

  const resetLink = generateResetLink(token)
  const subjectLine = 'Reset Your Conar Password'
  const template = resetPasswordTemplate(user.name || 'User', resetLink)

  await sendEmailIfValid(user.email, subjectLine, template)
}
