import { ORPCError, os } from '@orpc/server'
import { db } from '@tamery/db'
import { members } from '@tamery/db/schema'
import { infisical } from '@tamery/infisical'
import { LATEST_VERSION_BEFORE_SUBSCRIPTION } from '@tamery/shared/constants'
import type { Permissions } from '@tamery/shared/permissions'
import { permissionsOf } from '@tamery/shared/permissions'
import { and, asc, eq } from 'drizzle-orm'
import { memoize } from 'memoza'
import { createPermix } from 'permix/orpc'

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

    return infisical.secrets.get({
      name: INFISICAL_USER_ENCRYPTION_SECRET_NAME,
      path: ['users', owner.userId],
    })
  },
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

export const authMiddleware = logMiddleware.use(
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

export const optionalAuthMiddleware = logMiddleware.use(
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

export const permix = createPermix<Permissions>({
  onForbidden: ({ context }) => {
    const minorVersion = context.parsedAppVersion?.minor ?? 0

    throw new ORPCError('FORBIDDEN', {
      message:
        minorVersion < LATEST_VERSION_BEFORE_SUBSCRIPTION
          ? 'To use this feature, a subscription is now required. Please update to the latest version of the app and subscribe to a Pro plan to continue.'
          : 'To use this feature, a subscription is required. Please subscribe to a Pro plan to continue.',
    })
  },
}).contextKey('permissions')

export const permissionsMiddleware = logMiddleware.use(
  sessionOrpc.middleware(async ({ context, errors, next }) => {
    const session = await getSession(context.headers)

    if (!session) {
      throw errors.UNAUTHORIZED()
    }

    const subscription = await getSubscription(session.user.id)

    context.addLogData({
      userId: session.user.id,
      ...(subscription && {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      }),
    })

    return next({
      context: {
        ...session,
        getWorkspaceSecret,
        ...permix.setupContext(
          permissionsOf({
            hasSubscription: !!subscription,
            isAnonymous: !!session.user.isAnonymous,
          })
        ),
      },
    })
  })
)

export const cacheMiddleware = (ttl: number = 60 * 60 * 24) =>
  logMiddleware.use(
    orpc.middleware(async ({ next, path }, input, done) => {
      const cacheKey = path.join('/') + JSON.stringify(input)
      const cached = await redis.get(cacheKey)
      if (cached) {
        return done({ output: JSON.parse(cached) })
      }

      // oxlint-disable-next-line node/callback-return -- middleware caches after next()
      const result = await next()

      await redis.setEx(cacheKey, ttl, JSON.stringify(result.output))

      return result
    })
  )
