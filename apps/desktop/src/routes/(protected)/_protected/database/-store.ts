import type { FileRoutesById } from '~/routeTree.gen'
import { arrayMove } from '@dnd-kit/sortable'
import { Store, useStore } from '@tanstack/react-store'
import { type } from 'arktype'
import { getSQLQueries } from '~/entities/database/utils/helpers'

export interface Tab {
  table: string
  schema: string
  preview: boolean
}

const pageStoreType = type({
  lastOpenedPage: 'string | null',
  lastOpenedChatId: 'string | null',
  lastOpenedTable: type({ schema: 'string', table: 'string' }).or('null'),
  sql: 'string',
  selectedLines: 'number[]',
  queriesToRun: 'string[]',
  files: 'File[]',
  loggerOpened: 'boolean',
  chatInput: 'string',
  tabs: 'object[]' as type.cast<Tab[]>,
  tablesSearch: 'string',
  tablesAccordionValue: 'string[]',
})

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
  queriesToRun: [],
  selectedLines: [],
  files: [],
  loggerOpened: false,
  chatInput: '',
  tabs: [],
  tablesSearch: '',
  tablesAccordionValue: ['public'],
}

const storesMap = new Map<string, Store<typeof pageStoreType.infer>>()

export function databaseStore(id: string) {
  if (storesMap.has(id)) {
    return storesMap.get(id)!
  }

  const state = pageStoreType(Object.assign(
    defaultState,
    JSON.parse(localStorage.getItem(`database-store-${id}`) || '{}'),
  ))

  const store = new Store<typeof pageStoreType.infer>(
    state instanceof type.errors ? defaultState : state,
  )

  store.subscribe(({ currentVal }) => {
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
      tablesAccordionValue: currentVal.tablesAccordionValue,
    }))
  })

  storesMap.set(id, store)

  return store
}

export function useSQLQueries(id: string) {
  const store = databaseStore(id)

  return useStore(store, state => getSQLQueries(state.sql), {
    equal(objA, objB) {
      return JSON.stringify(objA) === JSON.stringify(objB)
    },
  })
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
      }))
      return
    }

    store.setState(prev => ({
      ...prev,
      tabs: [...prev.tabs, { table, schema, preview: true }],
    }))
    return
  }

  if (!store.state.tabs.find(tab => tab.table === table && tab.schema === schema && !tab.preview)) {
    store.setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => tab.table === table && tab.schema === schema ? { table, schema, preview: false } : tab) ?? [],
    }))
  }
}

export function removeTab(id: string, schema: string, table: string) {
  const store = databaseStore(id)

  store.setState(prev => ({
    ...prev,
    tabs: prev.tabs.filter(tab => !(tab.table === table && tab.schema === schema)) ?? [],
  }))
}

export function renameTab(id: string, schema: string, table: string, newTableName: string) {
  const store = databaseStore(id)

  store.setState(prev => ({
    ...prev,
    tabs: prev.tabs.map(tab => tab.table === table && tab.schema === schema ? { ...tab, table: newTableName } : tab) ?? [],
  }))
}

export function moveTab(id: string, activeId: string | number, overId: string | number) {
  const store = databaseStore(id)

  store.setState((prev) => {
    const items = prev.tabs ?? []

    const oldIndex = items.findIndex(item => item.table === activeId)
    const newIndex = items.findIndex(item => item.table === overId)

    return {
      ...prev,
      tabs: arrayMove(items, oldIndex, newIndex),
    }
  })
}
