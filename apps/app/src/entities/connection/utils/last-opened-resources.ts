import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

export const lastOpenedResourcesStorageValue = createWebStorageValue({
  type: 'localStorage',
  key: 'last-opened-resources',
  schema: type('string[]'),
  defaultValue: [],
})
