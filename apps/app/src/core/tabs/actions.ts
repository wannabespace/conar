import { getConnectionResourceStore } from '~/core/connection/stores'
import { permix } from '~/core/user/permissions'

import { resolveTab } from './kinds'
import type { ConnectionTab } from './types'

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

const isPreview = (tab: ConnectionTab) => !!tab.preview

export const setActiveTab = (id: string, tabId: string | null) => {
  getConnectionResourceStore(id).set(
    (state) => ({ ...state, activeTabId: tabId }) satisfies typeof state
  )
}

export const removeTab = (id: string, tabId: string) => {
  getConnectionResourceStore(id).set((state) => {
    const index = state.tabs.findIndex((tab) => tab.id === tabId)
    const neighbour = state.tabs[index + 1] ?? state.tabs[index - 1]
    return {
      ...state,
      activeTabId:
        state.activeTabId === tabId
          ? (neighbour?.id ?? null)
          : state.activeTabId,
      tabs: state.tabs.filter((tab) => tab.id !== tabId),
    } satisfies typeof state
  })
  resolveTab(tabId)?.kind.onClose?.(id, tabId)
}

const closeOtherTabsUnlessMultiple = (id: string, tabId: string) => {
  if (permix.check('tab.multiple')) {
    return
  }

  for (const tab of getConnectionResourceStore(id).get().tabs) {
    if (tab.id !== tabId) {
      removeTab(id, tab.id)
    }
  }
}

export const ensureTab = (id: string, tabId: string) => {
  closeOtherTabsUnlessMultiple(id, tabId)
  setTabs(id, (tabs) => {
    if (tabs.some((item) => item.id === tabId)) {
      return tabs
    }

    const previewIndex = tabs.findIndex(isPreview)
    const tab = { id: tabId }

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

export const replaceTabId = (id: string, from: string, to: string) => {
  setTabs(id, (tabs) =>
    tabs.map((tab) => (tab.id === from ? { ...tab, id: to } : tab))
  )
  const renamed = resolveTab(from)
  const target = resolveTab(to)
  if (renamed && target?.kind === renamed.kind) {
    renamed.kind.onRename?.(id, renamed.params, target.params)
  }
}

export const openTab = (id: string, tabId: string, preview = false) => {
  closeOtherTabsUnlessMultiple(id, tabId)
  setTabs(id, (tabs) => {
    const existingIndex = tabs.findIndex((item) => item.id === tabId)

    if (existingIndex !== -1) {
      const existing = tabs[existingIndex]

      if (!existing || !isPreview(existing) || preview) {
        return tabs
      }

      return tabs.with(existingIndex, { ...existing, preview: false })
    }

    const tab = { id: tabId, preview }

    if (!preview) {
      return [...tabs, tab]
    }

    const previewIndex = tabs.findIndex(isPreview)

    return previewIndex === -1 ? [...tabs, tab] : tabs.with(previewIndex, tab)
  })

  return tabId
}

export const updateTabs = (id: string, tabs: ConnectionTab[]) => {
  setTabs(id, () => tabs)
}
