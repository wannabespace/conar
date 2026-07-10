import { ORPCError, os } from '@orpc/server'
import type { Session } from 'better-auth'

import { env } from '~/env'

import type { Context } from './context'

export const orpc = os.$context<Context>()

async function getSession(headers: Headers) {
  const res = await fetch(`${env.API_URL}/auth/get-session`, {
    headers: {
      authorization: headers.get('authorization') ?? '',
      cookie: headers.get('cookie') ?? '',
    },
  })

  if (!res.ok) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'We could not find your session. Please sign in again.',
    })
  }

  const session = (await res.json()) as Session | null

  if (!session) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'We could not find your session. Please sign in again.',
    })
  }

  return session
}

export const authMiddleware = orpc.middleware(async ({ context, next }) => {
  const session = await getSession(context.headers)

  context.addLogData({ userId: session.userId })

  return next({
    context: {
      session,
    },
  })
})
