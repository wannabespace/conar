import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

export const lastLocationStorageValue = createWebStorageValue({
  defaultValue: null,
  key: 'last-location',
  schema: type('string | null'),
  type: 'localStorage',
})
