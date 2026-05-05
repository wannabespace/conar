import type { Context } from './context'
import { db } from '@conar/db'
import { memoize } from '@conar/memoize'
import { ORPCError, os } from '@orpc/server'
import { authClient } from '~/auth'

export const orpc = os.$context<Context>()

const getUserSecret = memoize(async (userId: string) => {
  const user = await db.query.users.findFirst({
    columns: {
      secret: true,
    },
    where: {
      id: userId,
    },
  })

  if (!user) {
    throw new ORPCError('UNAUTHORIZED', { message: `We could not find the user with id ${userId}. Please sign in again.` })
  }

  return user.secret
})

async function getSession(headers: Headers) {
  const { data: session } = await authClient.getSession({ fetchOptions: { headers } })

  if (!session) {
    throw new ORPCError('UNAUTHORIZED', { message: 'We could not find your session. Please sign in again.' })
  }

  return session
}

export const authMiddleware = orpc.middleware(async ({ context, next }) => {
  const session = await getSession(context.headers)

  context.addLogData({ userId: session.user.id })

  return next({
    context: {
      ...session,
      getUserSecret: () => getUserSecret(session.user.id),
    },
  })
})
