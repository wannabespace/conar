import { toast } from 'sonner'

import type { NavigatorList } from '.'
import { getConnectionResourceStore, getNavigatorStore } from '.'
import type { ConnectionTab, DefinitionsSection } from './tabs'
import {
  definitionsTabId,
  isPreviewTab,
  parseTabId,
  runnerLayoutKey,
  runnerStoreKey,
  runnerTabId,
  tableTabId,
  VISUALIZER_TAB_ID,
} from './tabs'

const setTabs = (
  id: string,
  update: (tabs: ConnectionTab[]) => ConnectionTab[]
) => {
  const store = getConnectionResourceStore(id)

  store.set(
    (state) =>
      ({
        ...state,
        tabs: update(state.tabs),
      }) satisfies typeof state
  )
}

export const setActiveTab = (id: string, tabId: string | null) => {
  const store = getConnectionResourceStore(id)

  store.set(
    (state) =>
      ({
        ...state,
        activeTabId: tabId,
      }) satisfies typeof state
  )
}

export const setNavigator = (id: string, navigator: NavigatorList) => {
  getNavigatorStore(id).set(navigator)
}

export const ensureTab = (id: string, tab: ConnectionTab) => {
  setTabs(id, (tabs) => {
    if (tabs.some((item) => item.id === tab.id)) {
      return tabs
    }

    const previewIndex = tabs.findIndex(isPreviewTab)

    return previewIndex === -1 ? [...tabs, tab] : tabs.with(previewIndex, tab)
  })
}

export const renameTab = (id: string, tabId: string, title: string | null) => {
  setTabs(id, (tabs) =>
    tabs.map((tab) => {
      if (tab.id !== tabId) {
        return tab
      }

      const { title: _, ...rest } = tab

      return title ? { ...rest, title } : rest
    })
  )
}

export const openTab = (id: string, tab: ConnectionTab) => {
  setTabs(id, (tabs) => {
    const existingIndex = tabs.findIndex((item) => item.id === tab.id)

    if (existingIndex !== -1) {
      const existing = tabs[existingIndex]

      if (!existing || !isPreviewTab(existing) || isPreviewTab(tab)) {
        return tabs
      }

      return tabs.with(existingIndex, { ...existing, preview: false })
    }

    if (!isPreviewTab(tab)) {
      return [...tabs, tab]
    }

    const previewIndex = tabs.findIndex(isPreviewTab)

    return previewIndex === -1 ? [...tabs, tab] : tabs.with(previewIndex, tab)
  })

  return tab.id
}

export const openTableTab = (
  id: string,
  schema: string,
  table: string,
  preview = false
) =>
  openTab(id, {
    id: tableTabId(schema, table),
    preview,
    schema,
    table,
    type: 'table',
  })

export const openDefinitionsTab = (
  id: string,
  section: DefinitionsSection,
  preview = false
) =>
  openTab(id, {
    id: definitionsTabId(section),
    preview,
    section,
    type: 'definitions',
  })

export const openRunnerTab = (id: string) =>
  openTab(id, { id: runnerTabId(), type: 'runner' })

export const openVisualizerTab = (id: string) =>
  openTab(id, { id: VISUALIZER_TAB_ID, type: 'visualizer' })

export const renameTableTab = (
  id: string,
  schema: string,
  table: string,
  newTableName: string
) => {
  const store = getConnectionResourceStore(id)

  store.set(
    (state) =>
      ({
        ...state,
        pinnedTables: state.pinnedTables.map((pinned) =>
          pinned.table === table && pinned.schema === schema
            ? { ...pinned, table: newTableName }
            : pinned
        ),
        tabs: state.tabs.map((tab) =>
          tab.type === 'table' && tab.table === table && tab.schema === schema
            ? {
                ...tab,
                id: tableTabId(schema, newTableName),
                table: newTableName,
              }
            : tab
        ),
      }) satisfies typeof state
  )
}

const clearTabStorage = (id: string, tabId: string) => {
  if (parseTabId(tabId)?.type !== 'runner') {
    return
  }

  localStorage.removeItem(runnerStoreKey(id, tabId))
  localStorage.removeItem(runnerLayoutKey(id, tabId))
}

export const removeTab = (id: string, tabId: string) => {
  setTabs(id, (tabs) => tabs.filter((tab) => tab.id !== tabId))
  clearTabStorage(id, tabId)
}

export const removeTableTab = (id: string, schema: string, table: string) => {
  const store = getConnectionResourceStore(id)

  store.set(
    (state) =>
      ({
        ...state,
        pinnedTables: state.pinnedTables.filter(
          (pinned) => pinned.table !== table || pinned.schema !== schema
        ),
        tabs: state.tabs.filter((tab) => tab.id !== tableTabId(schema, table)),
      }) satisfies typeof state
  )
}

export const updateTabs = (id: string, tabs: ConnectionTab[]) => {
  setTabs(id, () => tabs)
}

const MAX_PINNED_TABLES = 10

export const togglePinTable = (id: string, schema: string, table: string) => {
  const store = getConnectionResourceStore(id)

  store.set((state) => {
    const isPinned = state.pinnedTables.some(
      (t) => t.schema === schema && t.table === table
    )

    if (isPinned) {
      return {
        ...state,
        pinnedTables: state.pinnedTables.filter(
          (t) => !(t.schema === schema && t.table === table)
        ),
      } satisfies typeof state
    }

    if (state.pinnedTables.length >= MAX_PINNED_TABLES) {
      toast.info(
        `Only ${MAX_PINNED_TABLES} tables can be pinned. Last pinned table removed.`
      )
    }

    return {
      ...state,
      pinnedTables: [{ schema, table }, ...state.pinnedTables].slice(
        0,
        MAX_PINNED_TABLES
      ),
    } satisfies typeof state
  })
}

export const cleanupPinnedTables = (
  id: string,
  tables: { schema: string; table: string }[]
) => {
  const store = getConnectionResourceStore(id)

  store.set((state) => {
    const tablesSet = new Set(tables.map((t) => `${t.schema}:${t.table}`))

    const pinnedTables = state.pinnedTables.filter((t) =>
      tablesSet.has(`${t.schema}:${t.table}`)
    )

    if (pinnedTables.length !== state.pinnedTables.length) {
      return {
        ...state,
        pinnedTables,
      } satisfies typeof state
    }

    return state
  })
}
