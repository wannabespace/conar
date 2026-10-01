import { CONNECTION_RESOURCE_ROOT_SYMBOL } from '@tamery/shared/constants'
import { type } from 'arktype'
import { memoize } from 'memoza'
import { createWebStorageValue } from 'seitu/web'

import { connectionTabType } from '~/core/tabs/types'
import { connectionResourceStoreKey } from '~/lib/constants'

const schema = type({
  lastOpenedResourceName: 'string | null',
  proxy: {
    enabled: 'boolean',
    url: 'string | null',
  },
}).pipe(({ lastOpenedResourceName, proxy }) => ({
  lastOpenedResourceName: (lastOpenedResourceName ===
  CONNECTION_RESOURCE_ROOT_SYMBOL.description
    ? CONNECTION_RESOURCE_ROOT_SYMBOL
    : lastOpenedResourceName) as
    | string
    | typeof CONNECTION_RESOURCE_ROOT_SYMBOL
    | null,
  proxy,
}))

export const getConnectionStore = memoize((id: string) =>
  createWebStorageValue({
    defaultValue: {
      lastOpenedResourceName: null,
      proxy: { enabled: !window.electron, url: null },
    },
    key: `connection-store-${id}`,
    schema,
    type: 'localStorage',
  })
)

export const connectionResourceType = type({
  activeTabId: 'string | null',
  showSystem: 'boolean',
  tabs: connectionTabType.array(),
})

const connectionResourceDefaultState: typeof connectionResourceType.infer = {
  activeTabId: null,
  showSystem: false,
  tabs: [],
}

export const getConnectionResourceStore = memoize((id: string) =>
  createWebStorageValue({
    defaultValue: connectionResourceDefaultState,
    key: connectionResourceStoreKey(id),
    schema: connectionResourceType,
    type: 'localStorage',
  })
)
