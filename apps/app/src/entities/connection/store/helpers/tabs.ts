import { getConnectionResourceStore } from '..'
import {
  definitionsTabId,
  parseTabId,
  runnerLayoutKey,
  runnerStoreKey,
  runnerTabId,
  tableTabId,
  VISUALIZER_TAB_ID,
} from '../tabs/ids'
import type { ConnectionTab, DefinitionsSection } from '../tabs/types'
import { isPreviewTab } from '../tabs/types'

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

const clearTabStorage = (id: string, tabId: string) => {
  const tab = parseTabId(tabId)

  // Only runner ids are throwaway (`runner:<nanoid>`), so their storage is
  // orphaned on close. Table storage is keyed by schema+table and must survive
  // to restore column sizes and filters when the table is reopened.
  if (tab?.type === 'runner') {
    localStorage.removeItem(runnerStoreKey(id, tabId))
    localStorage.removeItem(runnerLayoutKey(id, tabId))
  }
}

export const removeTab = (id: string, tabId: string) => {
  setTabs(id, (tabs) => tabs.filter((tab) => tab.id !== tabId))
  clearTabStorage(id, tabId)
}

export const updateTabs = (id: string, tabs: ConnectionTab[]) => {
  setTabs(id, () => tabs)
}
