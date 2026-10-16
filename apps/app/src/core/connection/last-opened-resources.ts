import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

export const SHOWN_LAST_OPENED_RESOURCES = 5
export const MAX_REMEMBERED_RESOURCES = SHOWN_LAST_OPENED_RESOURCES * 2

export const lastOpenedResourcesStorageValue = createWebStorageValue({
  defaultValue: [],
  key: 'last-opened-resources',
  schema: type('string[]'),
  type: 'localStorage',
})
