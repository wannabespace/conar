import type { Permissions } from '@tamery/shared/permissions'
import { permissionsOf } from '@tamery/shared/permissions'
import { tryCatchAsync } from '@tamery/shared/utils'
import { createPermix } from 'permix'
import { usePermix } from 'permix/react'
import { useEffect } from 'react'

import { authClient, getSessionUser } from '~/lib/auth'
import { orpc } from '~/lib/orpc'
import { subscriptionQueryClient } from '~/lib/query-client'

import { isActiveSubscription, useSubscription } from './use-subscription'

// check() throws until setup() runs, so every route under _protected must stay behind loadPermissions.
export const permix = createPermix<Permissions>()

export const usePermissions = () => usePermix(permix)

export const loadPermissions = async () => {
  const user = await getSessionUser()
  const subscriptions = user?.isAnonymous
    ? null
    : await tryCatchAsync(() =>
        subscriptionQueryClient.ensureQueryData(
          orpc.account.subscription.list.queryOptions()
        )
      )

  permix.setup(
    permissionsOf({
      subscription: subscriptions?.data?.find(isActiveSubscription) ?? null,
      user: user ?? {},
    })
  )
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
