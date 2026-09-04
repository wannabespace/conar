import { os } from '@orpc/server'
import type { Session } from 'better-auth'

import { env } from '~/env'

import type { Context } from './context'

export const orpc = os.$context<Context>()

const getSession = async (headers: Headers) => {
  const res = await fetch(`${env.API_URL}/auth/get-session`, {
    headers: {
      authorization: headers.get('authorization') ?? '',
      cookie: headers.get('cookie') ?? '',
    },
  })

  return res.ok ? ((await res.json()) as Session | null) : null
}

export const authMiddleware = orpc
  .errors({
    UNAUTHORIZED: {
      message: 'We could not find your session. Please sign in again.',
    },
  })
  .middleware(async ({ context, errors, next }) => {
    const session = await getSession(context.headers)

    if (!session) {
      throw errors.UNAUTHORIZED()
    }

    context.addLogData({ userId: session.userId })

    return next({
      context: {
        session,
      },
    })
  })
