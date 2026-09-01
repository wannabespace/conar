import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

import { LAST_LOCATION_KEY } from './storage-keys'

export const lastLocationStorageValue = createWebStorageValue({
  defaultValue: null,
  key: LAST_LOCATION_KEY,
  schema: type('string | null'),
  type: 'localStorage',
})
