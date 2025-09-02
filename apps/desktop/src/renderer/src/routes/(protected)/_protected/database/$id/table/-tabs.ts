import { arrayMove } from '@dnd-kit/sortable'
import { Store, useStore } from '@tanstack/react-store'

export interface Tab {
  table: string
  schema: string
  preview: boolean
}

const tabsStore = new Store<Record<string, Tab[]>>(JSON.parse(localStorage.getItem('database-tables-tabs') ?? '{}'))

tabsStore.subscribe(({ currentVal }) => {
  localStorage.setItem('database-tables-tabs', JSON.stringify(currentVal))
})

export function useTabs(id: string) {
  return useStore(tabsStore, state => state[id] ?? [])
}

export function addTab(id: string, schema: string, table: string, preview?: boolean) {
  const tabs = tabsStore.state[id] ?? []

  if (preview) {
    const existingPreviewTabIndex = tabs.findIndex(tab => tab.preview)

    if (existingPreviewTabIndex !== -1) {
      tabsStore.setState(prev => ({
        ...prev,
        [id]: prev[id]?.map((tab, index) => index === existingPreviewTabIndex ? { table, schema, preview: true } : tab),
      }))
      return
    }

    tabsStore.setState(prev => ({
      ...prev,
      [id]: prev[id] ? [...prev[id], { table, schema, preview: true }] : [{ table, schema, preview: true }],
    }))
    return
  }

  if (!tabs.find(tab => tab.table === table && tab.schema === schema && !tab.preview)) {
    tabsStore.setState(prev => ({
      ...prev,
      [id]: prev[id]?.map(tab => tab.table === table && tab.schema === schema ? { table, schema, preview: false } : tab),
    }))
  }
}

export function closeTab(id: string, schema: string, table: string) {
  tabsStore.setState(prev => ({
    ...prev,
    [id]: prev[id]?.filter(tab => !(tab.table === table && tab.schema === schema)),
  }))
}

export function renameTab(id: string, schema: string, table: string, newTableName: string) {
  tabsStore.setState(prev => ({
    ...prev,
    [id]: prev[id]?.map(tab => tab.table === table && tab.schema === schema ? { ...tab, table: newTableName } : tab),
  }))
}

export function moveTab(id: string, activeId: string | number, overId: string | number) {
  tabsStore.setState((prev) => {
    const items = prev[id] ?? []

    const oldIndex = items.findIndex(item => item.table === activeId)
    const newIndex = items.findIndex(item => item.table === overId)

    return {
      ...prev,
      [id]: arrayMove(items, oldIndex, newIndex),
    }
  })
}
