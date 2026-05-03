import type { Context } from './context'
import { db } from '@conar/db'
import { ORPCError, os } from '@orpc/server'
import { auth } from '~/auth'

export const orpc = os.$context<Context>()

async function getUserSecret(userId: string) {
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
}

async function getSession(headers: Headers) {
  const session = await auth.api.getSession({ headers })

  if (!session) {
    throw new ORPCError('UNAUTHORIZED', { message: 'We could not find your session. Please sign in again.' })
  }

  return session
}

export const logMiddleware = orpc.middleware(async ({ context, next }, input) => {
  const result = await next()

  context.addLogData({
    input,
    output: (Array.isArray(result.output) && result.output.length > 0)
      || (typeof result.output === 'object' && result.output !== null && Object.keys(result.output).length > 0)
      || (!Array.isArray(result.output) && typeof result.output !== 'object' && result.output !== null && !!result.output)
      ? result.output
      : undefined,
  })

  return result
})

export const authMiddleware = logMiddleware.concat(orpc.middleware(async ({ context, next }) => {
  const session = await getSession(context.headers)

  context.addLogData({ userId: session.user.id })

  return next({
    context: {
      ...session,
      getUserSecret: () => getUserSecret(session.user.id),
    },
  })
}))
