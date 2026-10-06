import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

// The list shows three, skipping resources that no longer exist; the slack keeps it full after a few disappear.
export const MAX_REMEMBERED_RESOURCES = 10

export const lastOpenedResourcesStorageValue = createWebStorageValue({
  defaultValue: [],
  key: 'last-opened-resources',
  schema: type('string[]'),
  type: 'localStorage',
})
