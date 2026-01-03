import type { FileRoutesById } from '~/routeTree.gen'
import { Store } from '@tanstack/react-store'
import { type } from 'arktype'
import { toast } from 'sonner'
import { getEditorQueries } from '~/entities/database/utils/helpers'

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

export const databaseStoreType = type({
  lastOpenedPage: 'string | null',
  lastOpenedChatId: 'string | null',
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
  tablesTreeOpenedSchemas: 'string[] | null',
  pinnedTables: type({
    schema: 'string',
    table: 'string',
  }).array(),
  layout: layoutSettingsType,
})

const defaultState: typeof databaseStoreType.infer = {
  lastOpenedPage: null,
  lastOpenedChatId: null,
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
  tablesTreeOpenedSchemas: null,
  pinnedTables: [],
  layout: {
    chatVisible: true,
    chatPosition: 'right',
    resultsVisible: true,
  },
}

const storesMap = new Map<string, Store<typeof databaseStoreType.infer>>()

export function databaseStore(id: string) {
  if (storesMap.has(id)) {
    return storesMap.get(id)!
  }

  const persistedState = JSON.parse(localStorage.getItem(`database-store-${id}`) || '{}') as typeof defaultState

  persistedState.sql ||= defaultState.sql
  persistedState.editorQueries ||= getEditorQueries(persistedState.sql)

  const state = databaseStoreType(Object.assign(
    {},
    defaultState,
    persistedState,
  ))

  if (import.meta.env.DEV && state instanceof type.errors) {
    console.error('Invalid database store state', state.summary)
  }

  const store = new Store<typeof databaseStoreType.infer>(
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
      sql: currentVal.sql,
      selectedLines: currentVal.selectedLines,
      loggerOpened: currentVal.loggerOpened,
      chatInput: currentVal.chatInput,
      tabs: currentVal.tabs,
      tablesSearch: currentVal.tablesSearch,
      tablesTreeOpenedSchemas: currentVal.tablesTreeOpenedSchemas,
      pinnedTables: currentVal.pinnedTables,
      layout: currentVal.layout,
    } satisfies Omit<typeof currentVal, 'queriesToRun' | 'files' | 'editorQueries'>))
  })

  storesMap.set(id, store)

  return store
}

type LastOpenedPage = Extract<keyof FileRoutesById, `/(protected)/_protected/database/$id/${string}`>

export function getDatabasePageId(routesIds: (keyof FileRoutesById)[]) {
  return routesIds.find(route => route.includes('/(protected)/_protected/database/$id/')) as LastOpenedPage | undefined
}

export function addTab(id: string, schema: string, table: string, preview?: boolean) {
  const store = databaseStore(id)

  if (preview) {
    const existingPreviewTabIndex = store.state.tabs.findIndex(tab => tab.preview)

    if (existingPreviewTabIndex !== -1) {
      store.setState(prev => ({
        ...prev,
        tabs: prev.tabs.map((tab, index) => index === existingPreviewTabIndex ? { table, schema, preview: true } : tab) ?? [],
      } satisfies typeof prev))
      return
    }

    store.setState(prev => ({
      ...prev,
      tabs: [...prev.tabs, { table, schema, preview: true }],
    } satisfies typeof prev))
    return
  }

  if (!store.state.tabs.find(tab => tab.table === table && tab.schema === schema && !tab.preview)) {
    store.setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => tab.table === table && tab.schema === schema ? { table, schema, preview: false } : tab) ?? [],
    } satisfies typeof prev))
  }
}

export function renameTab(id: string, schema: string, table: string, newTableName: string) {
  const store = databaseStore(id)

  const rename = <T extends { table: string, schema: string }>(tab: T) =>
    tab.table === table && tab.schema === schema ? { ...tab, table: newTableName } : tab

  store.setState(prev => ({
    ...prev,
    tabs: prev.tabs.map(rename),
    pinnedTables: prev.pinnedTables.map(rename),
  } satisfies typeof prev))
}

export function removeTab(id: string, schema: string, table: string) {
  const store = databaseStore(id)

  const remove = <T extends { table: string, schema: string }>(tab: T) =>
    tab.table !== table || tab.schema !== schema

  store.setState(prev => ({
    ...prev,
    tabs: prev.tabs.filter(remove) ?? [],
    pinnedTables: prev.pinnedTables.filter(remove),
  } satisfies typeof prev))
}

export function updateTabs(id: string, newTabs: typeof tabType.infer[]) {
  const store = databaseStore(id)

  store.setState(state => ({
    ...state,
    tabs: newTabs,
  } satisfies typeof state))
}

const MAX_PINNED_TABLES = 10

export function togglePinTable(id: string, schema: string, table: string) {
  const store = databaseStore(id)

  store.setState((state) => {
    const isPinned = state.pinnedTables.some(
      t => t.schema === schema && t.table === table,
    )

    if (isPinned) {
      return {
        ...state,
        pinnedTables: state.pinnedTables.filter(t => !(t.schema === schema && t.table === table)),
      } satisfies typeof state
    }

    if (state.pinnedTables.length >= MAX_PINNED_TABLES) {
      toast.info(`Only ${MAX_PINNED_TABLES} tables can be pinned. Last pinned table removed.`)
    }

    return {
      ...state,
      pinnedTables: [{ schema, table }, ...state.pinnedTables].slice(0, MAX_PINNED_TABLES),
    } satisfies typeof state
  })
}

export function cleanupPinnedTables(
  id: string,
  tables: { schema: string, table: string }[],
) {
  const store = databaseStore(id)

  store.setState((state) => {
    const tablesSet = new Set(tables.map(t => `${t.schema}:${t.table}`))

    const pinnedTables = state.pinnedTables.filter(t => tablesSet.has(`${t.schema}:${t.table}`))

    if (pinnedTables.length !== state.pinnedTables.length) {
      return {
        ...state,
        pinnedTables,
      } satisfies typeof state
    }

    return state
  })
}

export function toggleChat(id: string) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    layout: {
      ...state.layout,
      chatVisible: !state.layout.chatVisible,
    },
  } satisfies typeof state))
}

export function toggleResults(id: string) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    layout: {
      ...state.layout,
      resultsVisible: !state.layout.resultsVisible,
    },
  } satisfies typeof state))
}

export function setChatPosition(id: string, position: typeof layoutSettingsType.infer['chatPosition']) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    layout: {
      ...state.layout,
      chatPosition: position,
    },
  } satisfies typeof state))
}
