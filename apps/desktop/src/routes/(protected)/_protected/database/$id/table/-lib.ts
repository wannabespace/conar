import { DEFAULT_COLUMN_WIDTH } from '~/entities/database'

export const selectSymbol = Symbol('table-selection')

const columnsSizeMap: Record<string, number> = {
  boolean: 160,
  number: 170,
  int: 150,
  uint: 150,
  tinyint: 150,
  decimal: 150,
  integer: 150,
  bigint: 170,
  timestamp: 240,
  datetime: 180,
  timestamptz: 240,
  float: 170,
  uuid: 290,
}

export function getColumnSize(type: string): number {
  return Object.entries(columnsSizeMap).find(([key]) => type.toLowerCase().includes(key.toLowerCase()))?.[1] ?? DEFAULT_COLUMN_WIDTH
}
