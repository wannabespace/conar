import type { VirtualItem } from '@tanstack/react-virtual'
import type { RefObject } from 'react'
import { createContext, use } from 'react'
import type { Store } from 'seitu'
import { useSubscription } from 'seitu/react'

import type { ColumnRenderer } from './'

export interface TableContextType {
  scrollRef: RefObject<HTMLDivElement | null>
  rows: Record<string, unknown>[]
  columns: ColumnRenderer[]
  virtualRows: VirtualItem[]
  virtualColumns: VirtualItem[]
  tableHeight: number
  tableWidth: number
}

export const TableContext = createContext<Store<TableContextType> | null>(null)

export const useTableStore = () => {
  const store = use(TableContext)
  if (!store) {
    throw new Error('useTableStore must be used within a TableProvider')
  }
  return store
}

export const useTableContext = <T>(selector: (value: TableContextType) => T) =>
  useSubscription(useTableStore(), { selector })
