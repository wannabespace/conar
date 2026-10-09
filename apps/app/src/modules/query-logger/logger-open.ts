import { type } from 'arktype'
import { memoize } from 'memoza'
import { createWebStorageValue } from 'seitu/web'

import { posthog } from '~/lib/posthog'

export const loggerOpen = memoize((resourceId: string) =>
  createWebStorageValue({
    defaultValue: false,
    key: `query-logger-open-${resourceId}`,
    schema: type('boolean'),
    type: 'localStorage',
  })
)

export const toggleLogger = (resourceId: string) => {
  loggerOpen(resourceId).set((opened) => !opened)
  posthog.capture('query_logger_toggled')
}
