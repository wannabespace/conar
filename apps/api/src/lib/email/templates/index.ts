import type { User } from 'better-auth'
import { generateResetLink, isResendConfigured, validateResetToken, verifyUserExists } from '~/lib/email/helpers'
import resetPasswordTemplate from '~/lib/email/templates/reset-password'
import { resend } from '~/lib/resend'

interface ResetPasswordEmailData {
  user: User
  token: string
}

/**
 * Send password reset email to user
 * @param data - User data and reset token
 */
export async function sendResetPasswordEmail(data: ResetPasswordEmailData) {
  if (!isResendConfigured()) {
    return
  }

  const existingUser = await verifyUserExists(data.user.email)
  if (!existingUser) {
    return
  }

  validateResetToken(data.token)

  const resetLink = generateResetLink(data.token)

  await resend!.emails.send({
    from: 'Conar <noreply@theharsh.xyz>',
    to: data.user.email,
    subject: 'Reset your Conar Password',
    html: resetPasswordTemplate(existingUser.name || 'User', resetLink),
  })
}
