import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

export const CHAT_MIN_WIDTH = 300
export const CHAT_MAX_WIDTH = 640
export const CHAT_DEFAULT_WIDTH = 380

export const chatWidthValue = createWebStorageValue({
  type: 'localStorage',
  key: 'chat-width',
  defaultValue: CHAT_DEFAULT_WIDTH,
  schema: type('number'),
})
