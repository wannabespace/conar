import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

export const lastLocationStorageValue = createWebStorageValue({
  type: 'localStorage',
  key: 'last-location',
  schema: type('string | null'),
  defaultValue: null,
})
