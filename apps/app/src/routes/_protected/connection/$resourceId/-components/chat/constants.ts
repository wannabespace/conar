import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

import { CHAT_DEFAULT_WIDTH, CHAT_WIDTH_KEY } from '~/lib/storage-keys'

export { CHAT_DEFAULT_WIDTH } from '~/lib/storage-keys'

export const CHAT_PANEL_ID = 'panel-chat'
export const CHAT_MIN_WIDTH = 300
export const CHAT_MAX_WIDTH = 900

export const chatWidthValue = createWebStorageValue({
  type: 'localStorage',
  key: CHAT_WIDTH_KEY,
  defaultValue: CHAT_DEFAULT_WIDTH,
  schema: type('number'),
})
