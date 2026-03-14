import type { connectionResourceType } from '.'
import { toast } from 'sonner'
import { getConnectionResourceStore } from '.'

export function addTab(id: string, schema: string, table: string, preview?: boolean) {
  const store = getConnectionResourceStore(id)
  const state = store.get()

  if (preview) {
    const existingPreviewTabIndex = state.tabs.findIndex(tab => tab.preview)

    if (existingPreviewTabIndex !== -1) {
      store.set(state => ({
        ...state,
        tabs: state.tabs.map((tab, index) => index === existingPreviewTabIndex ? { table, schema, preview: true } : tab) ?? [],
      } satisfies typeof state))
      return
    }

    store.set(state => ({
      ...state,
      tabs: [...state.tabs, { table, schema, preview: true }],
    } satisfies typeof state))
    return
  }

  if (!state.tabs.some(tab => tab.table === table && tab.schema === schema && !tab.preview)) {
    store.set(state => ({
      ...state,
      tabs: state.tabs.map(tab => tab.table === table && tab.schema === schema ? { table, schema, preview: false } : tab) ?? [],
    } satisfies typeof state))
  }
}

export function renameTab(id: string, schema: string, table: string, newTableName: string) {
  const store = getConnectionResourceStore(id)

  const rename = <T extends { table: string, schema: string }>(tab: T) =>
    tab.table === table && tab.schema === schema ? { ...tab, table: newTableName } : tab

  store.set(state => ({
    ...state,
    tabs: state.tabs.map(rename),
    pinnedTables: state.pinnedTables.map(rename),
  } satisfies typeof state))
}

export function removeTab(id: string, schema: string, table: string) {
  const store = getConnectionResourceStore(id)

  const remove = <T extends { table: string, schema: string }>(tab: T) =>
    tab.table !== table || tab.schema !== schema

  store.set(state => ({
    ...state,
    tabs: state.tabs.filter(remove) ?? [],
    pinnedTables: state.pinnedTables.filter(remove),
  } satisfies typeof state))
}

export function updateTabs(id: string, newTabs: typeof connectionResourceType.infer['tabs']) {
  const store = getConnectionResourceStore(id)

  store.set(state => ({
    ...state,
    tabs: newTabs,
  } satisfies typeof state))
}

const MAX_PINNED_TABLES = 10

export function togglePinTable(id: string, schema: string, table: string) {
  const store = getConnectionResourceStore(id)

  store.set((state) => {
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
  const store = getConnectionResourceStore(id)

  store.set((state) => {
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
  const store = getConnectionResourceStore(id)
  store.set(state => ({
    ...state,
    layout: {
      ...state.layout,
      chatVisible: isVisible ?? !state.layout.chatVisible,
    } satisfies typeof state.layout,
  } satisfies typeof state))
}

export function toggleResults(id: string) {
  const store = getConnectionResourceStore(id)
  store.set(state => ({
    ...state,
    layout: {
      ...state.layout,
      resultsVisible: !state.layout.resultsVisible,
    } satisfies typeof state.layout,
  } satisfies typeof state))
}

export function setChatPosition(id: string, position: typeof connectionResourceType.infer['layout']['chatPosition']) {
  const store = getConnectionResourceStore(id)
  store.set(state => ({
    ...state,
    layout: {
      ...state.layout,
      chatPosition: position,
    } satisfies typeof state.layout,
  } satisfies typeof state))
}
