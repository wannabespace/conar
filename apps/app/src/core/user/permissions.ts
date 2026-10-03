import type { Permissions } from '@tamery/shared/permissions'
import { permissionsOf } from '@tamery/shared/permissions'
import { type } from 'arktype'
import { createPermix } from 'permix'
import { usePermix } from 'permix/react'
import { useEffect } from 'react'
import { createWebStorageValue } from 'seitu/web'

import { authClient } from '~/lib/auth'

import { useSubscription } from './use-subscription'

const accessSchema = type({
  hasSubscription: 'boolean',
  isAnonymous: 'boolean',
})

// The last known access, so the first render (and the first row queries) already use it; Pro before any is known so nothing flickers disabled.
const accessValue = createWebStorageValue({
  defaultValue: { hasSubscription: true, isAnonymous: false },
  key: 'tamery.access',
  schema: accessSchema,
  type: 'localStorage',
})

export const permix = createPermix<Permissions>(
  permissionsOf(accessValue.get())
)

export const setAccess = (access: typeof accessSchema.infer) => {
  accessValue.set(access)
  permix.setup(permissionsOf(access))
}

export const resetAccess = () => {
  accessValue.clear()
  permix.setup(permissionsOf(accessValue.get()))
}

export const usePermissions = () => usePermix(permix)

export const usePermissionsSync = () => {
  const user = authClient.useSession().data?.user
  const { isPending, subscription } = useSubscription()
  const isAnonymous = !!user?.isAnonymous
  const hasSubscription = !!subscription
  const known = !!user && (isAnonymous || !isPending)

  useEffect(() => {
    if (known) {
      setAccess({ hasSubscription, isAnonymous })
    }
  }, [known, hasSubscription, isAnonymous])
}
