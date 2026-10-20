import { DEFAULT_COLUMN_WIDTH } from './constants'

const columnsSizeMap: Record<string, number> = {
  bigint: 170,
  boolean: 160,
  datetime: 210,
  decimal: 160,
  float: 170,
  function: 180,
  int: 150,
  integer: 150,
  multirange: 200,
  number: 170,
  nvarchar: 180,
  timestamp: 240,
  tinyint: 150,
  uint: 150,
  uuid: 290,
  variant: 200,
}

export const getColumnSize = (type: string): number =>
  Object.entries(columnsSizeMap).find(([key]) =>
    type.toLowerCase().includes(key.toLowerCase())
  )?.[1] ?? DEFAULT_COLUMN_WIDTH
