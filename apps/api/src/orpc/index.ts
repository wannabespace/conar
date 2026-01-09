import type { Context } from './context'
import { LATEST_VERSION_BEFORE_SUBSCRIPTION } from '@conar/shared/constants'
import { ORPCError, os } from '@orpc/server'
import { eq } from 'drizzle-orm'
import { db, subscriptions } from '~/drizzle'
import { auth } from '~/lib/auth'
import { redis } from '~/lib/redis'

export const orpc = os.$context<Context>()

async function getUserSecret(userId: string) {
  const user = await db.query.users.findFirst({
    columns: {
      secret: true,
    },
    where: (table, { eq }) => eq(table.id, userId),
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

export const authMiddleware = orpc.middleware(async ({ context, next }) => {
  const session = await getSession(context.headers)

  return next({
    context: {
      ...session,
      getUserSecret: () => getUserSecret(session.user.id),
    },
  })
})

async function getSubscription(userId: string) {
  const cachedSubscription = await redis.get(`subscription:${userId}`)

  if (cachedSubscription) {
    return JSON.parse(cachedSubscription) as typeof subscriptions.$inferSelect
  }

  const userSubscriptions = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId))

  const subscription = userSubscriptions.find(s => (s.status === 'active' || s.status === 'trialing') && !s.cancelAt) ?? null

  if (subscription) {
    await redis.setex(
      `subscription:${userId}`,
      60 * 30, // 30 minutes
      JSON.stringify(subscription),
    )
  }

  return subscription
}

export const requireSubscriptionMiddleware = orpc.middleware(async ({ context, next }) => {
  const session = await getSession(context.headers)
  const minorVersion = context.minorVersion ?? 0
  const subscription = await getSubscription(session.user.id)

  if (!subscription) {
    throw new ORPCError('FORBIDDEN', {
      message: minorVersion < LATEST_VERSION_BEFORE_SUBSCRIPTION
        ? 'To use this feature, a subscription is now required. Please update to the latest version of the app and subscribe to a Pro plan to continue.'
        : 'To use this feature, a subscription is required. Please subscribe to a Pro plan to continue.',
    })
  }

  return next({
    context: {
      ...session,
      getUserSecret: () => getUserSecret(session.user.id),
    },
  })
})
