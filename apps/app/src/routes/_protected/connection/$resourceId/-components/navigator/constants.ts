import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

import { NAVIGATOR_OPEN_KEY } from '~/lib/constants'

export const navigatorOpenValue = createWebStorageValue({
  type: 'localStorage',
  key: NAVIGATOR_OPEN_KEY,
  defaultValue: true,
  schema: type('boolean'),
})

export { SIDEBAR_DEFAULT_WIDTH } from '~/lib/constants'
