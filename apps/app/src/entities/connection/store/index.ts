import { CONNECTION_RESOURCE_ROOT_SYMBOL } from '@tamery/shared/constants'
import { type } from 'arktype'
import { memoize } from 'memoza'
import { createStore } from 'seitu'
import { createWebStorageValue } from 'seitu/web'

import type { FileRoutesById } from '~/routeTree.gen'

export * from './editor-queries'
export * from './helpers'

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
  lastOpenedChatId: 'string.uuid | null',
  lastOpenedPage: 'string | null' as type.cast<Extract<
    keyof FileRoutesById,
    `/_protected/connection/$resourceId/${string}`
  > | null>,
  lastOpenedTable: type({
    schema: 'string',
    table: 'string',
  }).or('null'),
  layout: {
    chatPosition: '"left" | "right"',
    chatVisible: 'boolean',
    resultsVisible: 'boolean',
  },
  loggerOpened: 'boolean',
  pinnedTables: type({
    schema: 'string',
    table: 'string',
  }).array(),
  queriesToRun: type({
    endLineNumber: 'number',
    query: 'string',
    startLineNumber: 'number',
  }).array(),
  query: 'string',
  selectedLines: 'number[]',
  showSystem: 'boolean',
  tablesSearch: 'string',
  tablesTreeOpenedSchemas: 'string[] | null',
  tabs: type({
    preview: 'boolean',
    schema: 'string',
    table: 'string',
  }).array(),
})

const connectionResourceDefaultState: typeof connectionResourceType.infer = {
  lastOpenedChatId: null,
  lastOpenedPage: null,
  lastOpenedTable: null,
  layout: {
    chatPosition: 'right',
    chatVisible: true,
    resultsVisible: true,
  },
  loggerOpened: false,
  pinnedTables: [],
  queriesToRun: [],
  query: [
    '-- Write your SQL query here based on your database schema',
    '-- The examples below are for reference only and may not work with your database',
    '',
    '-- Example: Basic query with limit',
    'SELECT * FROM users LIMIT 10;',
    '',
    '-- Example: Query with filtering',
    "SELECT id, name, email FROM users WHERE created_at > '2025-01-01' ORDER BY name;",
    '',
    '-- Example: Join example',
    'SELECT u.id, u.name, p.title FROM users u',
    'JOIN posts p ON u.id = p.user_id',
    'WHERE p.published = true',
    'LIMIT 10;',
  ].join('\n'),
  selectedLines: [],
  showSystem: false,
  tablesSearch: '',
  tablesTreeOpenedSchemas: null,
  tabs: [],
}

export const getConnectionResourceStore = memoize((id: string) =>
  createWebStorageValue({
    defaultValue: connectionResourceDefaultState,
    key: `connection-resource-store-${id}`,
    schema: connectionResourceType,
    type: 'localStorage',
  })
)

export const getFilesStore = memoize((_id: string) => createStore<File[]>([]))
