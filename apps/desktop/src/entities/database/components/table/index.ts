import type { Store } from '@tanstack/react-store'
import type { VirtualItem } from '@tanstack/react-virtual'
import { createContext, use } from 'react'

export { createCellUpdater } from './cells-updater'
export type { PageSize } from './footer'
export { DataTableFooter } from './footer'
export { DataTable } from './table'

export const DEFAULT_ROW_HEIGHT = 32
export const DEFAULT_COLUMN_WIDTH = 220

export const columnsSizeMap = new Map<string, number>([
  ['boolean', 150],
  ['number', 150],
  ['integer', 120],
  ['bigint', 150],
  ['float', 150],
  ['uuid', 290],
])

export const VirtualColumnsContext = createContext<VirtualItem[]>(null!)

export function useVirtualColumnsContext() {
  return use(VirtualColumnsContext)
}

export const SelectionStoreContext = createContext<Store<{
  selected: number[]
  rows: number[]
}>>(null!)

export function useSelectionStoreContext() {
  return use(SelectionStoreContext)
}
