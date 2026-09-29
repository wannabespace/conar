import { os } from '@orpc/server'
import { type } from 'arktype'

import { env } from '~/env'

import type { Context } from './context'

export const orpc = os.$context<Context>()

const sessionResponse = type({ session: { userId: 'string' } })

const getSession = async (headers: Headers) => {
  const res = await fetch(`${env.API_URL}/auth/get-session`, {
    headers: {
      authorization: headers.get('authorization') ?? '',
      cookie: headers.get('cookie') ?? '',
    },
  })

  if (!res.ok) {
    return null
  }

  const data = await res.json()
  return data ? sessionResponse.assert(data).session : null
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
