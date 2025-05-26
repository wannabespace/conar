import type { ContextSelector } from '@fluentui/react-context-selector'
import type { VirtualItem } from '@tanstack/react-virtual'
import type { ColumnRenderer } from '.'
import { createContext, useContextSelector } from '@fluentui/react-context-selector'

interface TableContextType {
  columns: ColumnRenderer[]
  virtualRows: VirtualItem[]
  virtualColumns: VirtualItem[]
}

const TableContext = createContext<TableContextType>(null!)

export const TableProvider = TableContext.Provider

export function useTableContext<T>(selector: ContextSelector<TableContextType, T>) {
  return useContextSelector(TableContext, selector)
}
