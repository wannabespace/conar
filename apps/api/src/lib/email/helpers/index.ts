import type { EmailService } from '../services/email-service'
import { eq } from 'drizzle-orm'
import { db, users } from '~/drizzle'
import { env } from '~/env'
import { resend } from '~/lib/resend'
import { ResendEmailService } from '../services/resend-service'

/**
 * Check if Resend email service is configured
 */
function isResendConfigured(): boolean {
  if (!resend) {
    console.error('Resend is not configured for password reset')
    return false
  }
  return true
}

/**
 * Verify if a user exists in the database by email
 * @param email - User's email address
 * @returns The user object if found, null otherwise
 */
export async function verifyUserExists(email: string) {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!existingUser) {
    console.error('User not found for password reset:', email)
    return null
  }

  return existingUser
}

/**
 * Validate reset token
 * @param token - Reset password token
 * @throws Error if token is invalid
 */
export function validateResetToken(token: string | undefined): asserts token is string {
  if (!token) {
    console.error('No token provided in reset password callback')
    throw new Error('Failed to get reset token')
  }
}

/**
 * Generate password reset link
 * @param token - Reset password token
 * @returns Full reset password URL
 */
export function generateResetLink(token: string): string {
  return `${env.WEB_URL}/reset-password?token=${token}`
}

/**
 * Send email if user is valid
 * @param email - User email
 * @param subjectLine - Email subject line
 * @param html - Email HTML content
 * @param validateUser - Whether to validate user existence
 */
export async function sendEmailIfValid(
  email: string,
  subjectLine: string,
  html: string,
  validateUser = true,
) {
  if (!isResendConfigured())
    return

  if (validateUser) {
    const userExists = await verifyUserExists(email)
    if (!userExists)
      return
  }

  const emailService: EmailService = new ResendEmailService()

  try {
    await emailService.sendEmail(email, subjectLine, html)
  }
  catch (error) {
    console.error(`Failed to send email to ${email}:`, error)
    throw error
  }
}
