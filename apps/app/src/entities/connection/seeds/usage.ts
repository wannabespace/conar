import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

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
