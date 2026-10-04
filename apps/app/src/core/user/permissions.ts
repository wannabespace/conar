import { GUEST_CONNECTIONS_MESSAGE } from '@tamery/shared/constants'
import type { Permissions } from '@tamery/shared/permissions'
import { permissionsOf } from '@tamery/shared/permissions'
import { tryCatchAsync } from '@tamery/shared/utils'
import { createPermix } from 'permix'
import { usePermix } from 'permix/react'
import { useEffect } from 'react'

import { authClient, getSessionUser, isAnonymous } from '~/lib/auth'
import { subscriptionQueryClient } from '~/lib/query-client'
import { promptSignIn, setIsSubscriptionDialogOpen } from '~/store'

import {
  isActiveSubscription,
  subscriptionsQueryOptions,
  useSubscription,
} from './use-subscription'

// check() throws until setup() runs, so every route under _protected must stay behind loadPermissions.
export const permix = createPermix<Permissions>()

export const usePermissions = () => usePermix(permix)

const SIGN_IN_HINTS: Partial<Record<keyof Permissions, string>> = {
  ai: 'AI features need an account.',
  connection: GUEST_CONNECTIONS_MESSAGE,
}

export const checkOrUpgrade = (...args: Parameters<typeof permix.check>) => {
  if (permix.check(...args)) {
    return true
  }

  const [path] = args

  if (isAnonymous()) {
    const group = typeof path === 'string' ? path.split('.')[0] : undefined
    promptSignIn(
      SIGN_IN_HINTS[group as keyof Permissions] ?? 'That needs an account.'
    )
  } else {
    setIsSubscriptionDialogOpen(true)
  }

  return false
}

export const loadPermissions = async () => {
  const user = await getSessionUser()
  const subscriptions = user?.isAnonymous
    ? null
    : await tryCatchAsync(() =>
        subscriptionQueryClient.query({
          ...subscriptionsQueryOptions,
          staleTime: 'static',
        })
      )

  permix.setup(
    permissionsOf({
      subscription: subscriptions?.data?.find(isActiveSubscription) ?? null,
      user: user ?? {},
    })
  )
}

export const resetGuestState = async () => {
  const { cleanCollections } = await import('~/core/collections')
  await cleanCollections()
  subscriptionQueryClient.clear()
  await loadPermissions()
}

export const usePermissionsSync = () => {
  const user = authClient.useSession().data?.user
  const { isLoading, subscription } = useSubscription()

  useEffect(() => {
    if (user && !isLoading) {
      permix.setup(permissionsOf({ subscription, user }))
    }
  }, [user, isLoading, subscription])
}
