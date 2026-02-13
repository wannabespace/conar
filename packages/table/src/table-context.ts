import type { ScrollDirection } from '@conar/ui/hookas/use-scroll-direction'
import type { ContextSelector } from '@fluentui/react-context-selector'
import type { VirtualItem } from '@tanstack/react-virtual'
import type { MouseEvent, RefObject } from 'react'
import type { ColumnRenderer } from './'
import { createContext, useContextSelector } from '@fluentui/react-context-selector'

export interface TableContextType {
  scrollRef: RefObject<HTMLDivElement | null>
  scrollDirection: ScrollDirection
  rows: Record<string, unknown>[]
  columns: ColumnRenderer[]
  virtualRows: VirtualItem[]
  virtualColumns: VirtualItem[]
  tableHeight: number
  tableWidth: number
  onRowClick?: (rowIndex: number, event: MouseEvent<HTMLDivElement>) => void
}

export const TableContext = createContext<TableContextType>(null!)

export function useTableContext<T>(selector: ContextSelector<TableContextType, T>) {
  return useContextSelector(TableContext, selector)
}
