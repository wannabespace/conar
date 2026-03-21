import { type } from 'arktype'
import { createLocalStorageValue } from 'seitu/web'

export const lastOpenedResourcesStorageValue = createLocalStorageValue({
  key: 'last-opened-resources',
  schema: type('string[]'),
  defaultValue: [],
})
