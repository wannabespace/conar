import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

export const CHAT_MIN_WIDTH = 300
export const CHAT_MAX_WIDTH = 560
export const CHAT_DEFAULT_WIDTH = 380

export const chatStore = createWebStorageValue({
  type: 'localStorage',
  key: 'chat-store',
  defaultValue: { width: CHAT_DEFAULT_WIDTH },
  schema: type({ width: 'number' }),
})
