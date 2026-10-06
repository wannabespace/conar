import { type } from 'arktype'
import { useSubscription } from 'seitu/react'
import { createWebStorageValue } from 'seitu/web'

import { usePermissions } from '~/core/user/permissions'

export const FREE_SEED_LIMIT = 10

export const seedUsageValue = createWebStorageValue({
  defaultValue: 0,
  key: 'seed-usage-count',
  schema: type('number'),
  type: 'localStorage',
})

export const incrementSeedUsage = () => {
  seedUsageValue.set((state) => state + 1)
}

export const useSeedQuota = () => {
  const unlimited = usePermissions().check('seed.unlimited')
  const remaining = Math.max(
    0,
    FREE_SEED_LIMIT - useSubscription(seedUsageValue)
  )

  return {
    hasReachedLimit: !unlimited && remaining === 0,
    remaining,
    unlimited,
  }
}
