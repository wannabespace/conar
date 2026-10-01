import { type } from 'arktype'
import { memoize } from 'memoza'
import { createWebStorageValue } from 'seitu/web'

export const chatOpen = memoize((resourceId: string) =>
  createWebStorageValue({
    defaultValue: false,
    key: `chat-open-${resourceId}`,
    schema: type('boolean'),
    type: 'localStorage',
  })
)

export const getChatStore = memoize((id: string) =>
  createWebStorageValue({
    defaultValue: null,
    key: `connection-resource-chat-${id}`,
    schema: type('string | null'),
    type: 'sessionStorage',
  })
)
