import type { FileRoutesById } from '~/routeTree.gen'
import { Store } from '@tanstack/react-store'
import { type } from 'arktype'
import { toast } from 'sonner'
import { getEditorQueries } from '~/entities/database/utils/helpers'

export const tabType = type({
  table: 'string',
  schema: 'string',
  preview: 'boolean',
})

export const queryToRunType = type({
  startLineNumber: 'number',
  endLineNumber: 'number',
  query: 'string',
})

export const layoutSettingsType = type({
  sidebarVisible: 'boolean',
  chatVisible: 'boolean',
  resultsVisible: 'boolean',
  chatPosition: '"right" | "bottom"',
  resultsPosition: '"bottom" | "right"',
  activeLayoutId: 'string | null',
})

export type LayoutSettings = typeof layoutSettingsType.infer

export const layoutPresetType = type({
  id: 'string',
  name: 'string',
  isBuiltIn: 'boolean',
  settings: layoutSettingsType,
})

export type LayoutPreset = typeof layoutPresetType.infer

export const BUILT_IN_LAYOUTS: LayoutPreset[] = [
  {
    id: 'editor-results-chat-right',
    name: 'Editor + Results + Chat (Right)',
    isBuiltIn: true,
    settings: {
      sidebarVisible: true,
      chatVisible: true,
      resultsVisible: true,
      chatPosition: 'right',
      resultsPosition: 'bottom',
      activeLayoutId: 'editor-results-chat-right',
    },
  },
  {
    id: 'editor-chat-right',
    name: 'Editor + Chat (Right)',
    isBuiltIn: true,
    settings: {
      sidebarVisible: true,
      chatVisible: true,
      resultsVisible: false,
      chatPosition: 'right',
      resultsPosition: 'bottom',
      activeLayoutId: 'editor-chat-right',
    },
  },
  {
    id: 'editor-results-no-chat',
    name: 'Editor + Results (No Chat)',
    isBuiltIn: true,
    settings: {
      sidebarVisible: true,
      chatVisible: false,
      resultsVisible: true,
      chatPosition: 'right',
      resultsPosition: 'bottom',
      activeLayoutId: 'editor-results-no-chat',
    },
  },
  {
    id: 'focus-editor',
    name: 'Focus Editor',
    isBuiltIn: true,
    settings: {
      sidebarVisible: false,
      chatVisible: false,
      resultsVisible: false,
      chatPosition: 'right',
      resultsPosition: 'bottom',
      activeLayoutId: 'focus-editor',
    },
  },
  {
    id: 'chat-bottom',
    name: 'Editor + Results + Chat (Bottom)',
    isBuiltIn: true,
    settings: {
      sidebarVisible: true,
      chatVisible: true,
      resultsVisible: true,
      chatPosition: 'bottom',
      resultsPosition: 'bottom',
      activeLayoutId: 'chat-bottom',
    },
  },
]

const pageStoreType = type({
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
  layouts: layoutPresetType.array(),
})

const defaultLayout: LayoutSettings = {
  sidebarVisible: true,
  chatVisible: true,
  resultsVisible: true,
  chatPosition: 'right',
  resultsPosition: 'bottom',
  activeLayoutId: 'editor-results-chat-right',
}

const defaultState: typeof pageStoreType.infer = {
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
  layout: defaultLayout,
  layouts: [...BUILT_IN_LAYOUTS],
}

const storesMap = new Map<string, Store<typeof pageStoreType.infer>>()

export function databaseStore(id: string) {
  if (storesMap.has(id)) {
    return storesMap.get(id)!
  }

  const persistedState = JSON.parse(localStorage.getItem(`database-store-${id}`) || '{}') as typeof defaultState

  persistedState.sql ||= defaultState.sql
  persistedState.editorQueries ||= getEditorQueries(persistedState.sql)

  const userLayouts = (persistedState.layouts || []).filter(l => !l.isBuiltIn)
  persistedState.layouts = [...BUILT_IN_LAYOUTS, ...userLayouts]

  const state = pageStoreType(Object.assign(
    {},
    defaultState,
    persistedState,
  ))

  if (import.meta.env.DEV && state instanceof type.errors) {
    console.error('Invalid database store state', state.summary)
  }

  const store = new Store<typeof pageStoreType.infer>(
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
      layouts: currentVal.layouts.filter(l => !l.isBuiltIn),
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

export function toggleSidebar(id: string) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    layout: {
      ...state.layout,
      sidebarVisible: !state.layout.sidebarVisible,
      activeLayoutId: null,
    },
  } satisfies typeof state))
}

export function toggleChat(id: string) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    layout: {
      ...state.layout,
      chatVisible: !state.layout.chatVisible,
      activeLayoutId: null,
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
      activeLayoutId: null,
    },
  } satisfies typeof state))
}

export interface SetPositionParams {
  id: string
  position: 'right' | 'bottom'
}

export function setChatPosition({ id, position }: SetPositionParams) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    layout: {
      ...state.layout,
      chatPosition: position,
      activeLayoutId: null,
    },
  } satisfies typeof state))
}

export function setResultsPosition({ id, position }: SetPositionParams) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    layout: {
      ...state.layout,
      resultsPosition: position,
      activeLayoutId: null,
    },
  } satisfies typeof state))
}

export function applyLayout(id: string, layoutId: string) {
  const store = databaseStore(id)
  const layoutPreset = store.state.layouts.find(l => l.id === layoutId)
  if (!layoutPreset)
    return

  store.setState(state => ({
    ...state,
    layout: {
      ...layoutPreset.settings,
      activeLayoutId: layoutId,
    },
  } satisfies typeof state))
}

export function createLayout(id: string, name: string): string {
  const store = databaseStore(id)
  const layoutId = `custom-${Date.now()}`

  const newLayout: LayoutPreset = {
    id: layoutId,
    name,
    isBuiltIn: false,
    settings: {
      ...store.state.layout,
      activeLayoutId: layoutId,
    },
  }

  store.setState(state => ({
    ...state,
    layouts: [...state.layouts, newLayout],
    layout: {
      ...state.layout,
      activeLayoutId: layoutId,
    },
  } satisfies typeof state))

  return layoutId
}

export function renameLayout(id: string, layoutId: string, newName: string) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    layouts: state.layouts.map(l =>
      l.id === layoutId && !l.isBuiltIn
        ? { ...l, name: newName }
        : l,
    ),
  } satisfies typeof state))
}

export function deleteLayout(id: string, layoutId: string) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    layouts: state.layouts.filter(l => l.id !== layoutId || l.isBuiltIn),
    layout: {
      ...state.layout,
      activeLayoutId: state.layout.activeLayoutId === layoutId ? null : state.layout.activeLayoutId,
    },
  } satisfies typeof state))
}
