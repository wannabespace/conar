import type { Permissions } from '@tamery/shared/permissions'
import { permissionsOf } from '@tamery/shared/permissions'
import { createPermix } from 'permix'
import { usePermix } from 'permix/react'
import { useEffect } from 'react'

import { authClient } from '~/lib/auth'

import { useSubscription } from './use-subscription'

const PRO = { plan: 'pro' } as const

// Unknown access is treated as Pro until the session and subscription arrive, so a guest's locked controls show enabled for a moment after boot; the server checks are the real gate.
export const permix = createPermix<Permissions>(
  permissionsOf({ subscription: PRO, user: {} })
)

export const usePermissions = () => usePermix(permix)

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
