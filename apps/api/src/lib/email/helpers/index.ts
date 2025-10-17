import { eq } from 'drizzle-orm'
import { db, users } from '~/drizzle'
import { env } from '~/env'
import { resend } from '~/lib/resend'

/**
 * Check if Resend email service is configured
 */
export function isResendConfigured(): boolean {
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
