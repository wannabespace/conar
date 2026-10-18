import { db } from '@tamery/db'
import { earlyAccess, users } from '@tamery/db/schema'
import { EARLY_ACCESS_ERROR_CODE } from '@tamery/shared/constants'
import { APIError } from 'better-auth/api'
import { eq } from 'drizzle-orm'

export const requireEarlyAccess = async (rawEmail: string) => {
  const email = rawEmail.toLowerCase()
  const [entry] = await db
    .select({ grantedAt: earlyAccess.grantedAt })
    .from(earlyAccess)
    .where(eq(earlyAccess.email, email))

  if (entry?.grantedAt) {
    return
  }

  await db.insert(earlyAccess).values({ email }).onConflictDoNothing()

  throw new APIError('FORBIDDEN', {
    code: EARLY_ACCESS_ERROR_CODE,
    message: "Tamery is in early access. You're on the list.",
  })
}

export const requireUserEarlyAccess = async (userId: string) => {
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))

  if (user) {
    await requireEarlyAccess(user.email)
  }
}
