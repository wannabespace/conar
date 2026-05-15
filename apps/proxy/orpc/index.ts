import type { Session } from 'better-auth'
import type { Context } from './context'
import { db } from '@conar/db'
import { ORPCError, os } from '@orpc/server'
import { memoize } from 'memoza'
import { env } from '~/env'

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
  const res = await fetch(`${env.API_URL}/auth/get-session`, {
    headers: {
      authorization: headers.get('authorization') ?? '',
      cookie: headers.get('cookie') ?? '',
    },
  })

  if (!res.ok) {
    throw new ORPCError('UNAUTHORIZED', { message: 'We could not find your session. Please sign in again.' })
  }

  const session = await res.json() as Session | null

  if (!session) {
    throw new ORPCError('UNAUTHORIZED', { message: 'We could not find your session. Please sign in again.' })
  }

  return session
}

export const authMiddleware = orpc.middleware(async ({ context, next }) => {
  const session = await getSession(context.headers)

  context.addLogData({ userId: session.userId })

  return next({
    context: {
      session,
      getUserSecret: () => getUserSecret(session.userId),
    },
  })
})
