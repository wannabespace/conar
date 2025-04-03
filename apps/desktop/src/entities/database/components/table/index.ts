import type { Database } from '~/lib/indexeddb'
import { createContext, use } from 'react'

export type { PageSize } from './footer'
export { DataTableFooter } from './footer'
export { DataTable } from './table'

export const DEFAULT_ROW_HEIGHT = 35
export const DEFAULT_COLUMN_WIDTH = 220

export const columnsSizeMap = new Map<string, number>([
  ['boolean', 150],
  ['number', 150],
  ['integer', 120],
  ['bigint', 150],
  ['float', 150],
  ['uuid', 290],
])

export const TableContext = createContext<{
  database?: Database
  tableName?: string
}>(null!)

export function useTableContext() {
  const context = use(TableContext)
  if (!context)
    throw new Error('useTableContext must be used within a TableContext')
  return context
}
