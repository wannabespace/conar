import type { databaseStoreType } from '.'
import { toast } from 'sonner'
import { databaseStore } from '.'

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

export function updateTabs(id: string, newTabs: typeof databaseStoreType.infer['tabs']) {
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

export function toggleChat(id: string, isVisible?: boolean) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    layout: {
      ...state.layout,
      chatVisible: isVisible ?? !state.layout.chatVisible,
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

export function setChatPosition(id: string, position: typeof databaseStoreType.infer['layout']['chatPosition']) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    layout: {
      ...state.layout,
      chatPosition: position,
    },
  } satisfies typeof state))
}
