import type { FileRoutesById } from '~/routeTree.gen'
import { memoize } from '@conar/shared/utils/helpers'
import { type } from 'arktype'
import { createComputed, createStore } from 'seitu'
import { createLocalStorageValue } from 'seitu/web'
import { getEditorQueries } from '~/entities/connection/utils'

export * from './helpers'

export const getConnectionStore = memoize((id: string) => createLocalStorageValue({
  key: `connection-store-${id}`,
  defaultValue: {
    lastOpenedResourceName: null,
  },
  schema: type({
    lastOpenedResourceName: 'string | null',
  }),
}))

export const connectionResourceType = type({
  lastOpenedPage: 'string | null' as type.cast<Extract<keyof FileRoutesById, `/_protected/connection/$resourceId/${string}`> | null>,
  lastOpenedChatId: 'string | null',
  lastOpenedTable: type({
    schema: 'string',
    table: 'string',
  }).or('null'),
  query: 'string',
  selectedLines: 'number[]',
  showSystem: 'boolean',
  queriesToRun: type({
    startLineNumber: 'number',
    endLineNumber: 'number',
    query: 'string',
  }).array(),
  loggerOpened: 'boolean',
  tabs: type({
    table: 'string',
    schema: 'string',
    preview: 'boolean',
  }).array(),
  tablesSearch: 'string',
  definitionsSearch: 'string',
  tablesTreeOpenedSchemas: 'string[] | null',
  pinnedTables: type({
    schema: 'string',
    table: 'string',
  }).array(),
  layout: {
    chatVisible: 'boolean',
    resultsVisible: 'boolean',
    chatPosition: '"left" | "right"',
  },
})

const connectionResourceDefaultState: typeof connectionResourceType.infer = {
  lastOpenedPage: null,
  lastOpenedChatId: null,
  lastOpenedTable: null,
  query: [
    '-- Write your SQL query here based on your database schema',
    '-- The examples below are for reference only and may not work with your database',
    '',
    '-- Example: Basic query with limit',
    'SELECT * FROM users LIMIT 10;',
    '',
    '-- Example: Query with filtering',
    'SELECT id, name, email FROM users WHERE created_at > \'2025-01-01\' ORDER BY name;',
    '',
    '-- Example: Join example',
    'SELECT u.id, u.name, p.title FROM users u',
    'JOIN posts p ON u.id = p.user_id',
    'WHERE p.published = true',
    'LIMIT 10;',
  ].join('\n'),
  showSystem: false,
  queriesToRun: [],
  selectedLines: [],
  loggerOpened: false,
  tabs: [],
  tablesSearch: '',
  definitionsSearch: '',
  tablesTreeOpenedSchemas: null,
  pinnedTables: [],
  layout: {
    chatVisible: true,
    chatPosition: 'right',
    resultsVisible: true,
  },
}

export const getConnectionResourceStore = memoize((id: string) => createLocalStorageValue({
  key: `connection-resource-store-${id}`,
  defaultValue: connectionResourceDefaultState,
  schema: connectionResourceType,
}))

export const getEditorQueriesComputed = memoize((id: string) => {
  const store = getConnectionResourceStore(id)
  const computed = createComputed(store, state => getEditorQueries(state.query))

  computed.subscribe((editorQueries) => {
    const state = store.get()
    const currentLineNumbers = editorQueries.map(query => query.startLineNumber)
    const newSelectedLines = state.selectedLines.filter(line => currentLineNumbers.includes(line))

    if (
      newSelectedLines.length !== state.selectedLines.length
      || newSelectedLines.some((line, i) => line !== state.selectedLines[i])
    ) {
      store.set(state => ({
        ...state,
        selectedLines: newSelectedLines.toSorted((a, b) => a - b),
      } satisfies typeof state))
    }
  })

  return computed
})

export const getFilesStore = memoize((_id: string) => createStore<File[]>([]))
