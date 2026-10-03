import type { Permissions } from '@tamery/shared/permissions'
import { permissionsOf } from '@tamery/shared/permissions'
import { tryCatchAsync } from '@tamery/shared/utils'
import { createPermix } from 'permix'
import { usePermix } from 'permix/react'
import { useEffect } from 'react'

import { authClient } from '~/lib/auth'

import { useSubscription } from './use-subscription'

const PRO = { plan: 'pro' } as const

// Unknown access is treated as Pro until the session and subscription arrive, so a guest's locked controls show undimmed for a moment after boot; the server checks are the real gate.
export const permix = createPermix<Permissions>(
  permissionsOf({ subscription: PRO, user: {} })
)

export const usePermissions = () => usePermix(permix)

// Route guards run before usePermissionsSync's first effect. A guest's rules need only the session, so a guard loads it; a member keeps the Pro default until the subscription arrives.
export const loadGuestPermissions = async () => {
  const { data } = await tryCatchAsync(authClient.getSession)
  const user = data?.data?.user

  if (user?.isAnonymous) {
    permix.setup(permissionsOf({ subscription: null, user }))
  }
}

export const usePermissionsSync = () => {
  const user = authClient.useSession().data?.user
  const { isPending, subscription } = useSubscription()

  useEffect(() => {
    if (user) {
      permix.setup(
        permissionsOf({ subscription: isPending ? PRO : subscription, user })
      )
    }
  }, [user, isPending, subscription])
}
