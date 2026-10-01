import { type } from 'arktype'
import { memoize } from 'memoza'
import { createWebStorageValue } from 'seitu/web'

export const loggerOpen = memoize((resourceId: string) =>
  createWebStorageValue({
    defaultValue: false,
    key: `query-logger-open-${resourceId}`,
    schema: type('boolean'),
    type: 'localStorage',
  })
)
