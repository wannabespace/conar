import { eq } from 'drizzle-orm'
import { db, users } from '~/drizzle'
import { env } from '~/env'
import { resend } from '~/lib/email/config/resend'
import { ResendEmailService } from '../services/resend-service'

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

export function generateResetLink(token: string): string {
  return `${env.WEB_URL}/reset-password?token=${token}`
}

export async function sendEmailIfValid(
  email: string,
  subjectLine: string,
  template: string,
  validateUser = true,
) {
  if (!resend) {
    console.error('Resend email service is not configured.')
    return
  }

  if (validateUser) {
    const userExists = await verifyUserExists(email)
    if (!userExists)
      return
  }

  const emailService = new ResendEmailService()

  await emailService.sendEmail(email, subjectLine, template)
}
