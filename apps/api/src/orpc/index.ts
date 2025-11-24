import type { Context } from './context'
import { ORPCError, os } from '@orpc/server'
import { db } from '~/drizzle'
import { auth } from '~/lib/auth'

export const orpc = os.$context<Context>()

async function getUserSecret(userId: string) {
  const user = await db.query.users.findFirst({
    columns: {
      secret: true,
    },
    where: (table, { eq }) => eq(table.id, userId),
  })

  if (!user) {
    throw new ORPCError('UNAUTHORIZED', { message: `We could not find the user with id ${userId}. Please sign in again.` })
  }

  return user.secret
}

export const authMiddleware = orpc.middleware(async ({ context, next }) => {
  const session = await auth.api.getSession({
    headers: context.headers,
  })

  if (!session) {
    throw new ORPCError('UNAUTHORIZED', { message: 'We could not find your session. Please sign in again.' })
  }

  return next({
    context: {
      ...session,
      getUserSecret: () => getUserSecret(session.user.id),
    },
  })
})
