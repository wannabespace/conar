import { ORPCError, os } from '@orpc/server'
import { db } from '@tamery/db'
import { members } from '@tamery/db/schema'
import { infisical } from '@tamery/infisical'
import { LATEST_VERSION_BEFORE_SUBSCRIPTION } from '@tamery/shared/constants'
import { and, asc, eq } from 'drizzle-orm'
import { memoize } from 'memoza'

import { INFISICAL_USER_ENCRYPTION_SECRET_NAME } from '~/constants'
import { auth } from '~/lib/auth'
import { redis } from '~/lib/redis'
import { getSubscription } from '~/lib/subscription'

import type { Context } from './context'

export { getSubscription } from '~/lib/subscription'

export const orpc = os.$context<Context>()

export const getWorkspaceSecret = memoize(
  async (workspaceId: string) => {
    const [owner] = await db
      .select({ userId: members.userId })
      .from(members)
      .where(
        and(eq(members.workspaceId, workspaceId), eq(members.role, 'owner'))
      )
      .orderBy(asc(members.createdAt))
      .limit(1)

    if (!owner) {
      throw new ORPCError('NOT_FOUND', { message: 'Workspace not found' })
    }

    // The secret still lives at the owner's Infisical user path; moving it to
    // ['workspaces', workspaceId] later only changes this lookup.
    return infisical.secrets.get({
      name: INFISICAL_USER_ENCRYPTION_SECRET_NAME,
      path: ['users', owner.userId],
    })
  },
  // 5 minutes
  { maxAge: 5 * 60 * 1000 }
)

const getSession = (headers: Headers) => auth.api.getSession({ headers })

const sessionOrpc = orpc.errors({
  UNAUTHORIZED: {
    message: 'We could not find your session. Please sign in again.',
  },
})

const logMiddleware = orpc.middleware(async ({ context, next }, input) => {
  // oxlint-disable-next-line node/callback-return -- middleware post-processes next()
  const result = await next()

  if (
    !context.request.url.endsWith('/sync') &&
    !context.request.url.endsWith('/resolveConnectionString')
  ) {
    context.addLogData({
      input,
      output:
        (Array.isArray(result.output) && result.output.length > 0) ||
        (typeof result.output === 'object' &&
          result.output !== null &&
          Object.keys(result.output).length > 0) ||
        (!Array.isArray(result.output) &&
          typeof result.output !== 'object' &&
          result.output !== null &&
          !!result.output)
          ? result.output
          : undefined,
    })
  }

  return result
})

// oRPC Middleware.concat chains middlewares (not Array#concat)
// oxlint-disable-next-line unicorn/prefer-spread
export const authMiddleware = logMiddleware.concat(
  sessionOrpc.middleware(async ({ context, errors, next }) => {
    const session = await getSession(context.headers)

    if (!session) {
      throw errors.UNAUTHORIZED()
    }

    context.addLogData({ userId: session.user.id })

    return next({
      context: {
        ...session,
        getWorkspaceSecret,
      },
    })
  })
)

// oxlint-disable-next-line unicorn/prefer-spread
export const optionalAuthMiddleware = logMiddleware.concat(
  orpc.middleware(async ({ context, next }) => {
    const session = await getSession(context.headers).catch(() => null)

    if (session) {
      context.addLogData({ userId: session.user.id })
    }

    return next({
      context: {
        session: session?.session ?? null,
        user: session?.user ?? null,
      },
    })
  })
)

// oxlint-disable-next-line unicorn/prefer-spread
export const subscriptionMiddleware = logMiddleware.concat(
  sessionOrpc
    .errors({ FORBIDDEN: {} })
    .middleware(async ({ context, errors, next }) => {
      const session = await getSession(context.headers)

      if (!session) {
        throw errors.UNAUTHORIZED()
      }

      const minorVersion = context.parsedAppVersion?.minor ?? 0
      const subscription = await getSubscription(session.user.id)

      context.addLogData({ userId: session.user.id })

      if (!subscription) {
        throw errors.FORBIDDEN({
          message:
            minorVersion < LATEST_VERSION_BEFORE_SUBSCRIPTION
              ? 'To use this feature, a subscription is now required. Please update to the latest version of the app and subscribe to a Pro plan to continue.'
              : 'To use this feature, a subscription is required. Please subscribe to a Pro plan to continue.',
        })
      }

      context.addLogData({
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      })

      return next({
        context: {
          ...session,
          getWorkspaceSecret,
          subscription,
        },
      })
    })
)

// oxlint-disable-next-line unicorn/prefer-spread
export const optionalSubscriptionMiddleware = logMiddleware.concat(
  sessionOrpc.middleware(async ({ context, errors, next }) => {
    const session = await getSession(context.headers)

    if (!session) {
      throw errors.UNAUTHORIZED()
    }

    const subscription = await getSubscription(session.user.id)

    context.addLogData({ userId: session.user.id })

    return next({
      context: {
        ...session,
        getWorkspaceSecret,
        subscription,
      },
    })
  })
)

export const cacheMiddleware = (ttl: number = 60 * 60 * 24) =>
  // oxlint-disable-next-line unicorn/prefer-spread
  logMiddleware.concat(
    orpc.middleware(async ({ next, path }, input, output) => {
      const cacheKey = path.join('/') + JSON.stringify(input)
      const cached = await redis.get(cacheKey)
      if (cached) {
        return output(JSON.parse(cached))
      }

      // oxlint-disable-next-line node/callback-return -- middleware caches after next()
      const result = await next()

      await redis.setex(cacheKey, ttl, JSON.stringify(result.output))

      return result
    })
  )
