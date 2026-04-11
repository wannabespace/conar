import type { columnType } from '~/entities/connection/queries/columns'
import { DEFAULT_COLUMN_WIDTH } from '@conar/table/constants'

export interface Column {
  id: string
  uiType: 'select' | 'list' | 'boolean' | 'date' | 'datetime' | 'raw'
  type?: string
  label?: string
  enumName?: string
  availableValues?: string[]
  isArray?: boolean
  isEditable?: boolean
  isNullable?: boolean
  maxLength?: number | null
  precision?: number | null
  scale?: number | null
  unique?: string
  primaryKey?: string
  defaultValue?: string | null
  foreign?: {
    name: string
    schema: string
    table: string
    column: string
    onDelete?: string
    onUpdate?: string
  }
  references?: {
    name: string
    schema: string
    table: string
    column: string
    isUnique?: boolean
  }[]
}

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
  float: 170,
  uuid: 290,
}

export function getColumnSize(type: string): number {
  return Object.entries(columnsSizeMap).find(([key]) => type.toLowerCase().includes(key.toLowerCase()))?.[1] ?? DEFAULT_COLUMN_WIDTH
}

export function getColumnUiType(column: typeof columnType.infer): Column['uiType'] {
  if (column.isArray)
    return 'list'

  if (column.enumName)
    return 'select'

  if (column.type === 'boolean')
    return 'boolean'

  // if (column.type.toLowerCase().includes('datetime') || column.type.toLowerCase().includes('timestamp'))
  //   return 'datetime'

  // if (column.type.toLowerCase().includes('date'))
  //   return 'date'

  return 'raw'
}
