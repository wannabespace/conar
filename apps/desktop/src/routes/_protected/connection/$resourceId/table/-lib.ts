import { DEFAULT_COLUMN_WIDTH } from '~/entities/connection/components/table/utils'

const SELECT_COLUMN_ID = '!__(selection_column)__!'
const ACTIONS_COLUMN_ID = '!__(actions_column)__!'

export const INTERNAL_COLUMN_IDS = {
  SELECT: SELECT_COLUMN_ID,
  ACTIONS: ACTIONS_COLUMN_ID,
}

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
  datetime: 210,
  nvarchar: 180,
  timestamptz: 240,
  float: 170,
  uuid: 290,
}

export function getColumnSize(type: string): number {
  return Object.entries(columnsSizeMap).find(([key]) => type.toLowerCase().includes(key.toLowerCase()))?.[1] ?? DEFAULT_COLUMN_WIDTH
}
