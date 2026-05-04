import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

export const FREE_SEED_LIMIT = 10

export const seedUsageValue = createWebStorageValue({
  type: 'localStorage',
  key: 'seed-usage-count',
  schema: type('number'),
  defaultValue: 0,
})

export function incrementSeedUsage() {
  seedUsageValue.set(state => state + 1)
}
