import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

import {
  NAVIGATOR_OPEN_KEY,
  NAVIGATOR_WIDTH_KEY,
  SIDEBAR_DEFAULT_WIDTH,
} from '~/lib/storage-keys'

export const NAVIGATOR_PANEL_ID = 'panel-navigator'

export const navigatorWidthValue = createWebStorageValue({
  type: 'localStorage',
  key: NAVIGATOR_WIDTH_KEY,
  defaultValue: SIDEBAR_DEFAULT_WIDTH,
  schema: type('number'),
})

export const navigatorOpenValue = createWebStorageValue({
  type: 'localStorage',
  key: NAVIGATOR_OPEN_KEY,
  defaultValue: true,
  schema: type('boolean'),
})

export {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from '~/lib/storage-keys'
