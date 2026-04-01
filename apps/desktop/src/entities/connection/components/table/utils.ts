import { DEFAULT_COLUMN_WIDTH } from '@conar/table/constants'

export interface Column {
  id: string
  type: string
  label?: string
  enum?: string
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

function prepareValue(value: unknown) {
  if (value instanceof Date)
    return value.toISOString()

  return value
}

export function getEditableValue({
  value,
  oneLine,
  column,
}: {
  value: unknown
  oneLine: boolean
  column: Column
}) {
  const _value = prepareValue(value)

  if (typeof _value === 'object' && _value !== null) {
    return oneLine
      ? JSON.stringify(_value).replaceAll('\n', ' ')
      : JSON.stringify(_value, null, 2)
  }

  if (column.type === 'boolean' && !column.isArray && _value === null)
    return 'false'

  return oneLine
    ? String(_value ?? '').replaceAll('\n', ' ')
    : String(_value ?? '')
}

export function getDisplayValue({
  value,
  size,
  column,
}: {
  value: unknown
  size: number
  column: Column
}) {
  if (value === null)
    return 'null'

  if (value === '')
    return 'empty'

  /*
    If value has a lot of symbols that don't fit in the cell,
    we truncate it to avoid performance issues.
    Used 6 as a multiplier because 1 symbol takes ~6px width
    + 5 to make sure there are extra symbols for ellipsis
    + 50 for resizing
  */
  return getEditableValue({ value, oneLine: true, column }).slice(0, (size / 6) + 5 + 50)
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
  timestamptz: 240,
  float: 170,
  uuid: 290,
}

export function getColumnSize(type: string): number {
  return Object.entries(columnsSizeMap).find(([key]) => type.toLowerCase().includes(key.toLowerCase()))?.[1] ?? DEFAULT_COLUMN_WIDTH
}
