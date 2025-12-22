import type { Context } from './context'
import { LATEST_VERSION_BEFORE_SUBSCRIPTION } from '@conar/shared/constants'
import { ORPCError, os } from '@orpc/server'
import { db } from '~/drizzle'
import { auth } from '~/lib/auth'

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

export const authMiddleware = orpc.middleware(async ({ context, next }) => {
  const session = await auth.api.getSession({
    headers: context.headers,
  })

  if (!session) {
    throw new ORPCError('UNAUTHORIZED', { message: 'We could not find your session. Please sign in again.' })
  }

  return next({
    context: {
      ...session,
      getUserSecret: () => getUserSecret(session.user.id),
    },
  })
})

async function getSubscription(context: Context) {
  const subscriptions = await auth.api.listActiveSubscriptions({
    headers: context.headers,
  })
  return subscriptions.find(s => s.status === 'active' || s.status === 'trialing') ?? null
}

export const subscriptionMiddleware = authMiddleware.concat(orpc.middleware(async ({ context, next }) => {
  return next({ context: { subscription: await getSubscription(context) } })
}))

export const requireSubscriptionMiddleware = authMiddleware.concat(orpc.middleware(async ({ context, next }) => {
  const minorVersion = context.minorVersion ?? 0
  const subscription = await getSubscription(context)

  if (!subscription) {
    throw new ORPCError('FORBIDDEN', {
      message: minorVersion < LATEST_VERSION_BEFORE_SUBSCRIPTION
        ? 'You have no active subscription. Please subscribe to a plan to continue.'
        : 'To use this feature, a subscription is now required. Please update to the latest version of the app and subscribe to a plan to continue.',
    })
  }

  return next({ context: { subscription } })
}))
