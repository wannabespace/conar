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
