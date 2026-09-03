import { CONNECTION_RESOURCE_ROOT_SYMBOL } from '@tamery/shared/constants'
import { type } from 'arktype'
import { memoize } from 'memoza'
import { createStore } from 'seitu'
import { createWebStorageValue } from 'seitu/web'

import { connectionResourceStoreKey } from '~/lib/constants'

import { connectionTabType } from './tabs/types'

export * from './helpers/navigator'
export * from './helpers/tables'
export * from './helpers/tabs'
export * from './helpers/visualizer'
export * from './tabs/ids'
export * from './tabs/title'
export * from './tabs/types'

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

export const viewportType = type({
  x: 'number',
  y: 'number',
  zoom: 'number',
})

export const connectionResourceType = type({
  activeTabId: 'string | null',
  chatId: 'string | null',
  chatOpened: 'boolean',
  loggerOpened: 'boolean',
  pinnedTables: type({
    schema: 'string',
    table: 'string',
  }).array(),
  showSystem: 'boolean',
  tablesSearch: 'string',
  tablesTreeOpenedSchemas: 'string[] | null',
  tabs: connectionTabType.array(),
  'visualizerViewports?': {
    '[string]': viewportType,
  },
})

const connectionResourceDefaultState: typeof connectionResourceType.infer = {
  activeTabId: null,
  chatId: null,
  chatOpened: false,
  loggerOpened: false,
  pinnedTables: [],
  showSystem: false,
  tablesSearch: '',
  tablesTreeOpenedSchemas: null,
  tabs: [],
  visualizerViewports: {},
}

export const getConnectionResourceStore = memoize((id: string) =>
  createWebStorageValue({
    defaultValue: connectionResourceDefaultState,
    key: connectionResourceStoreKey(id),
    schema: connectionResourceType,
    type: 'localStorage',
  })
)

export const getFilesStore = memoize((_id: string) => createStore<File[]>([]))

export const getNavigatorStore = memoize((_id: string) =>
  createStore<'tables' | 'definitions'>('tables')
)
