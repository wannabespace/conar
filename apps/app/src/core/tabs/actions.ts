import { getConnectionResourceStore } from '~/core/connection/stores'
import { permix } from '~/core/user/permissions'
import { promptSignIn } from '~/store'

import { resolveTab } from './kinds'
import type { ConnectionTab } from './types'

const setTabs = (
  id: string,
  update: (tabs: ConnectionTab[]) => ConnectionTab[]
) => {
  const store = getConnectionResourceStore(id)
  const tabs = update(store.get().tabs)

  const multiple = permix.check('tab.multiple')

  if (!multiple && tabs.length > 1) {
    promptSignIn('tabs')
  }

  store.set(
    (state) =>
      ({
        ...state,
        tabs: multiple ? tabs : tabs.slice(-1),
      }) satisfies typeof state
  )
}

const isPreview = (tab: ConnectionTab) => !!tab.preview

export const setActiveTab = (id: string, tabId: string | null) => {
  getConnectionResourceStore(id).set(
    (state) => ({ ...state, activeTabId: tabId }) satisfies typeof state
  )
}

export const ensureTab = (id: string, tabId: string) => {
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
}

export const openTab = (id: string, tabId: string, preview = false) => {
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

export const removeTab = (id: string, tabId: string) => {
  setTabs(id, (tabs) => tabs.filter((tab) => tab.id !== tabId))
  resolveTab(tabId)?.kind.onClose?.(id, tabId)
}

export const updateTabs = (id: string, tabs: ConnectionTab[]) => {
  setTabs(id, () => tabs)
}
