import type { ContextSelector } from '@fluentui/react-context-selector'
import type { VirtualItem } from '@tanstack/react-virtual'
import type { ComponentType } from 'react'
import { createContext, useContextSelector } from '@fluentui/react-context-selector'

export * from './body'
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

interface TableContextValue {
  data: Record<string, unknown>[]
  columns: ColumnRenderer[]
  virtualRows: VirtualItem[]
  virtualColumns: VirtualItem[]
  rowWidth: number
}

export const TableContext = createContext<TableContextValue>(null!)

export const TableProvider = TableContext.Provider

export function useTableContext<T>(selector: ContextSelector<TableContextValue, T>) {
  return useContextSelector(TableContext, selector)
}

export interface TableCellProps {
  rowIndex: number
  columnIndex: number
  value: unknown
}

export interface TableHeaderCellProps {
  columnIndex: number
}

export interface ColumnRenderer {
  id: string
  size: number
  cell: ComponentType<TableCellProps>
  header: ComponentType<TableHeaderCellProps>
}
