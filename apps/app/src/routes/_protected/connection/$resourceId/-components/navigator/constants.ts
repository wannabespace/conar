import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

export const SIDEBAR_MIN_WIDTH = 180
export const SIDEBAR_MAX_WIDTH = 420
export const SIDEBAR_DEFAULT_WIDTH = 256

export const navigatorWidthValue = createWebStorageValue({
  type: 'localStorage',
  key: 'navigator-width',
  defaultValue: SIDEBAR_DEFAULT_WIDTH,
  schema: type('number'),
})

export const navigatorOpenValue = createWebStorageValue({
  type: 'localStorage',
  key: 'navigator-open',
  defaultValue: true,
  schema: type('boolean'),
})
