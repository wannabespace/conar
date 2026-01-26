import type { FileRoutesById } from '~/routeTree.gen'
import { Store } from '@tanstack/react-store'
import { type } from 'arktype'
import { getEditorQueries } from '~/entities/connection/utils'

export * from './helpers'

const tabType = type({
  table: 'string',
  schema: 'string',
  preview: 'boolean',
})

const definitionTabType = type({
  type: '"enums" | "constraints" | "indexes"',
})

const queryToRunType = type({
  startLineNumber: 'number',
  endLineNumber: 'number',
  query: 'string',
})

const layoutSettingsType = type({
  chatVisible: 'boolean',
  resultsVisible: 'boolean',
  chatPosition: '"left" | "right"',
})

export const connectionStoreType = type({
  lastOpenedPage: 'string | null' as type.cast<(Extract<keyof FileRoutesById, `/_protected/database/$id/${string}`> | null)>,
  lastOpenedChatId: 'string | null',
  definitionTabs: definitionTabType.array(),
  lastOpenedTable: type({
    schema: 'string',
    table: 'string',
  }).or('null'),
  sql: 'string',
  selectedLines: 'number[]',
  editorQueries: type({
    startLineNumber: 'number',
    endLineNumber: 'number',
    queries: 'string[]',
  }).array(),
  queriesToRun: queryToRunType.array(),
  files: 'File[]',
  loggerOpened: 'boolean',
  chatInput: 'string',
  tabs: tabType.array(),
  tablesSearch: 'string',
  definitionsSearch: 'string',
  tablesTreeOpenedSchemas: 'string[] | null',
  pinnedTables: type({
    schema: 'string',
    table: 'string',
  }).array(),
  layout: layoutSettingsType,
})

const defaultState: typeof connectionStoreType.infer = {
  lastOpenedPage: null,
  lastOpenedChatId: null,
  definitionTabs: [],
  lastOpenedTable: null,
  sql: [
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
  editorQueries: [],
  queriesToRun: [],
  selectedLines: [],
  files: [],
  loggerOpened: false,
  chatInput: '',
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

const storesMap = new Map<string, Store<typeof connectionStoreType.infer>>()

export function connectionStore(id: string) {
  if (storesMap.has(id)) {
    return storesMap.get(id)!
  }

  const persistedState = JSON.parse(
    localStorage.getItem(`connection-store-${id}`)
    // TODO: remove this in the future
    || localStorage.getItem(`database-store-${id}`)
    || '{}',
  ) as typeof defaultState

  persistedState.sql ||= defaultState.sql
  persistedState.editorQueries ||= getEditorQueries(persistedState.sql)

  const state = connectionStoreType(Object.assign(
    {},
    defaultState,
    persistedState,
  ))

  if (import.meta.env.DEV && state instanceof type.errors) {
    console.error('Invalid connection store state', state.summary)
  }

  const store = new Store<typeof connectionStoreType.infer>(
    state instanceof type.errors ? defaultState : state,
  )

  store.subscribe(({ currentVal, prevVal }) => {
    if (prevVal.sql !== currentVal.sql) {
      store.setState(state => ({
        ...state,
        editorQueries: getEditorQueries(state.sql),
      } satisfies typeof state))
    }

    localStorage.setItem(`database-store-${id}`, JSON.stringify({
      lastOpenedPage: currentVal.lastOpenedPage,
      lastOpenedChatId: currentVal.lastOpenedChatId,
      lastOpenedTable: currentVal.lastOpenedTable,
      definitionTabs: currentVal.definitionTabs,
      sql: currentVal.sql,
      selectedLines: currentVal.selectedLines,
      loggerOpened: currentVal.loggerOpened,
      chatInput: currentVal.chatInput,
      tabs: currentVal.tabs,
      tablesSearch: currentVal.tablesSearch,
      definitionsSearch: currentVal.definitionsSearch,
      tablesTreeOpenedSchemas: currentVal.tablesTreeOpenedSchemas,
      pinnedTables: currentVal.pinnedTables,
      layout: currentVal.layout,
    } satisfies Omit<typeof currentVal, 'queriesToRun' | 'files' | 'editorQueries'>))
  })

  storesMap.set(id, store)

  return store
}
