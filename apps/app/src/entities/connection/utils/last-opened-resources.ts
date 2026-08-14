import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

export const lastOpenedResourcesStorageValue = createWebStorageValue({
  defaultValue: [],
  key: 'last-opened-resources',
  schema: type('string[]'),
  type: 'localStorage',
})
