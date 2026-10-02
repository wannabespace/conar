import type { Permissions, Plan } from '@tamery/shared/permissions'
import { permissionsOf, planOf } from '@tamery/shared/permissions'
import { type } from 'arktype'
import { createPermix } from 'permix'
import { usePermix } from 'permix/react'
import { useEffect } from 'react'
import { createWebStorageValue } from 'seitu/web'

import { authClient } from '~/lib/auth'

import { useSubscription } from './use-subscription'

// The last known plan, so the first render (and the first row queries) already use it; Pro before any is known so nothing flickers disabled.
const planValue = createWebStorageValue({
  defaultValue: 'pro',
  key: 'tamery.plan',
  schema: type("'free' | 'guest' | 'pro'"),
  type: 'localStorage',
})

export const permix = createPermix<Permissions>(permissionsOf(planValue.get()))

export const setPlan = (plan: Plan) => {
  planValue.set(plan)
  permix.setup(permissionsOf(plan))
}

export const resetPlan = () => {
  planValue.clear()
  permix.setup(permissionsOf(planValue.get()))
}

export const usePermissions = () => usePermix(permix)

export const usePermissionsSync = () => {
  const user = authClient.useSession().data?.user
  const { isPending, subscription } = useSubscription()
  const plan =
    user && (user.isAnonymous || !isPending)
      ? planOf(user, !!subscription)
      : null

  useEffect(() => {
    if (plan) {
      setPlan(plan)
    }
  }, [plan])
}
