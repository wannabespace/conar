import type { ContextSelector } from '@fluentui/react-context-selector'
import type { Store } from '@tanstack/react-store'
import type { VirtualItem } from '@tanstack/react-virtual'
import { createContext, useContextSelector } from '@fluentui/react-context-selector'

export * from './body'
export { createCellUpdater } from './cells-updater'
export {
  FilterForm,
  FilterItem,
  FiltersProvider,
} from './filters'
export type { PageSize } from './footer'
export * from './footer'
export * from './header'
export * from './skeleton'
export * from './table'

export const DEFAULT_ROW_HEIGHT = 32
export const DEFAULT_COLUMN_WIDTH = 220

export const columnsSizeMap = new Map<string, number>([
  ['boolean', 150],
  ['number', 150],
  ['integer', 120],
  ['bigint', 160],
  ['float', 150],
  ['uuid', 290],
])

export interface StoreValue {
  selected: number[]
  sort: {
    column: string
    direction: 'asc' | 'desc'
  }[]
  hiddenColumns: string[]
}

interface TableContextValue {
  store: Store<StoreValue>
  data: Record<string, unknown>[]
  columns: ColumnRenderer[]
  virtualRows: VirtualItem[]
  virtualColumns: VirtualItem[]
  rowWidth: number
  selectable: boolean
  selected?: number[]
  onUpdate?: (rowIndex: number, columnName: string, value: unknown) => Promise<void>
  onSelect?: (rows: number[]) => void
}

export const TableContext = createContext<TableContextValue>(null!)

export const TableProvider = TableContext.Provider

export function useTableContext<T>(selector: ContextSelector<TableContextValue, T>) {
  return useContextSelector(TableContext, selector)
}

export interface Column {
  name: string
  type?: string
  isEditable?: boolean
  isNullable?: boolean
  isPrimaryKey?: boolean
}

export interface ColumnRenderer {
  id: string
  meta?: Column
  size: number
  cell: React.ComponentType<{ value: unknown, rowIndex: number, column: ColumnRenderer, index: number }>
  header: React.ComponentType<{ column: ColumnRenderer, index: number }>
}
