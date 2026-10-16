import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

import { TRANSPARENT_BACKGROUND_KEY } from './constants'

export const transparentBackgroundValue = createWebStorageValue({
  defaultValue: true,
  key: TRANSPARENT_BACKGROUND_KEY,
  schema: type('boolean'),
  type: 'localStorage',
})
