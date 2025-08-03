import type { Context } from './context'
import { ORPCError, os } from '@orpc/server'
import { auth } from '~/lib/auth'

export const orpc = os.$context<Context>()

export const authMiddleware = orpc.middleware(async ({ context, next }) => {
  const session = await auth.api.getSession({
    headers: context.headers,
  })

  if (!session) {
    throw new ORPCError('UNAUTHORIZED', { message: 'We could not find your session. Please sign in again.' })
  }

  return next({
    context: session,
  })
})
