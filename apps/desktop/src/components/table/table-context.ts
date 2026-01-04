import type { ScrollDirection } from '@conar/ui/hookas/use-scroll-direction'
import type { VirtualItem } from '@tanstack/react-virtual'
import type { RefObject } from 'react'
import type { ColumnRenderer } from '.'
import { createContext } from '@fluentui/react-context-selector'

export interface TableContextType {
  scrollRef: RefObject<HTMLDivElement | null>
  scrollDirection: ScrollDirection
  rows: Record<string, unknown>[]
  columns: ColumnRenderer[]
  virtualRows: VirtualItem[]
  virtualColumns: VirtualItem[]
  tableHeight: number
  tableWidth: number
}

export const TableContext = createContext<TableContextType>(null!)
