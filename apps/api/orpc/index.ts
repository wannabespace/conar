import { ORPCError, os } from '@orpc/server'
import { infisical } from '@tamery/infisical'
import { LATEST_VERSION_BEFORE_SUBSCRIPTION } from '@tamery/shared/constants'
import { memoize } from 'memoza'

import { INFISICAL_USER_ENCRYPTION_SECRET_NAME } from '~/constants'
import { auth } from '~/lib/auth'
import { redis } from '~/lib/redis'
import { getSubscription } from '~/lib/subscription'

import type { Context } from './context'

export { getSubscription } from '~/lib/subscription'

export const orpc = os.$context<Context>()

// 5 minutes
export const getUserSecret = memoize(
  (userId: string) =>
    infisical.secrets.get({
      name: INFISICAL_USER_ENCRYPTION_SECRET_NAME,
      path: ['users', userId],
    }),
  { maxAge: 5 * 60 * 1000 }
)

const getSession = async (headers: Headers) => {
  const session = await auth.api.getSession({ headers })

  if (!session) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'We could not find your session. Please sign in again.',
    })
  }

  return session
}

export const logMiddleware = orpc.middleware(
  async ({ context, next }, input) => {
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
  }
)

// oRPC Middleware.concat chains middlewares (not Array#concat)
// oxlint-disable-next-line unicorn/prefer-spread
export const authMiddleware = logMiddleware.concat(
  orpc.middleware(async ({ context, next }) => {
    const session = await getSession(context.headers)

    context.addLogData({ userId: session.user.id })

    return next({
      context: {
        ...session,
        getUserSecret: () => getUserSecret(session.user.id),
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
  orpc.middleware(async ({ context, next }) => {
    const session = await getSession(context.headers)
    const minorVersion = context.parsedAppVersion?.minor ?? 0
    const subscription = await getSubscription(session.user.id)

    if (session) {
      context.addLogData({ userId: session.user.id })
    }

    if (!subscription) {
      throw new ORPCError('FORBIDDEN', {
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
        getUserSecret: () => getUserSecret(session.user.id),
        subscription,
      },
    })
  })
)

// oxlint-disable-next-line unicorn/prefer-spread
export const optionalSubscriptionMiddleware = logMiddleware.concat(
  orpc.middleware(async ({ context, next }) => {
    const session = await getSession(context.headers)
    const subscription = await getSubscription(session.user.id)

    context.addLogData({ userId: session.user.id })

    return next({
      context: {
        ...session,
        getUserSecret: () => getUserSecret(session.user.id),
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
