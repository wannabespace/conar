import type { FileRoutesById } from '~/routeTree.gen'
import { memoize } from '@conar/shared/utils/helpers'
import { createStore } from '@tanstack/react-store'
import { type } from 'arktype'
import { getEditorQueries } from '~/entities/connection/utils'

export * from './helpers'

const tabType = type({
  table: 'string',
  schema: 'string',
  preview: 'boolean',
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

export const getConnectionResourceStoreType = type({
  lastOpenedPage: 'string | null' as type.cast<(Extract<keyof FileRoutesById, `/_protected/connection/$resourceId/${string}`> | null)>,
  lastOpenedChatId: 'string | null',
  lastOpenedTable: type({
    schema: 'string',
    table: 'string',
  }).or('null'),
  query: 'string',
  selectedLines: 'number[]',
  showSystem: 'boolean',
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

const defaultState: typeof getConnectionResourceStoreType.infer = {
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

export const getConnectionResourceStore = memoize((id: string) => {
  const persistedState = JSON.parse(localStorage.getItem(`connection-resource-store-${id}`) || '{}') as typeof defaultState

  persistedState.query ||= defaultState.query

  const state = getConnectionResourceStoreType(Object.assign(
    {},
    defaultState,
    persistedState,
  ))

  if (import.meta.env.DEV && state instanceof type.errors) {
    console.error('Invalid connection store state', state.summary)
  }

  const store = createStore<typeof getConnectionResourceStoreType.infer>(
    state instanceof type.errors ? defaultState : state,
  )

  store.subscribe((state) => {
    localStorage.setItem(`connection-resource-store-${id}`, JSON.stringify({
      lastOpenedPage: state.lastOpenedPage,
      lastOpenedChatId: state.lastOpenedChatId,
      lastOpenedTable: state.lastOpenedTable,
      query: state.query,
      showSystem: state.showSystem,
      selectedLines: state.selectedLines,
      loggerOpened: state.loggerOpened,
      chatInput: state.chatInput,
      tabs: state.tabs,
      tablesSearch: state.tablesSearch,
      definitionsSearch: state.definitionsSearch,
      tablesTreeOpenedSchemas: state.tablesTreeOpenedSchemas,
      pinnedTables: state.pinnedTables,
      layout: state.layout,
    } satisfies Omit<typeof state, 'queriesToRun' | 'files'>))
  })

  return store
})

export const getConnectionResourceEditorQueriesStore = memoize((id: string) => {
  const connectionResourceStore = getConnectionResourceStore(id)
  return createStore(() => getEditorQueries(connectionResourceStore.state.query))
})
