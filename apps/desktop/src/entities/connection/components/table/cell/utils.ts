import type { columnType } from '~/entities/connection/queries/columns'
import { DEFAULT_COLUMN_WIDTH } from '@conar/table/constants'

export interface Column {
  id: string
  uiType: 'select' | 'list' | 'boolean' | 'raw'
  type?: string
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

const pgArrayRegex = /^\{.*\}$/

export function parseArrayValue(value: unknown): string[] {
  if (value === null || value === undefined || value === '')
    return []

  if (Array.isArray(value))
    return value.map(String)

  if (typeof value !== 'string')
    return [String(value)]

  // JSON array ["a","b"]
  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed))
        return parsed.map(String)
    }
    catch {}
  }

  // PG array {a,b,c}
  if (pgArrayRegex.test(value)) {
    const inner = value.slice(1, -1)
    return inner === '' ? [] : inner.split(',').map(v => v.trim())
  }

  // MySQL SET a,b,c
  if (value.includes(','))
    return value.split(',').map(v => v.trim())

  return [value]
}

export function getEditableValue({
  value,
  column,
}: {
  value: unknown
  column: Column
}) {
  const _value = prepareValue(value)

  if (column.isArray && column.enum && _value !== null) {
    const parsed = parseArrayValue(_value)
    return JSON.stringify(parsed, null, 2)
  }

  if (typeof _value === 'object' && _value !== null) {
    return JSON.stringify(_value, null, 2)
  }

  if (column.type === 'boolean' && !column.isArray && _value === null)
    return 'false'

  return String(_value ?? '')
}

export function getDisplayValue({
  value,
  size,
}: {
  value: unknown
  size: number
}) {
  let show = String(value ?? '')

  if (value === null)
    show = 'null'

  if (value === '')
    show = 'empty'

  if (typeof value === 'object')
    show = JSON.stringify(value)

  /*
    If value has a lot of symbols that don't fit in the cell,
    we truncate it to avoid performance issues.
    Used 6 as a multiplier because 1 symbol takes ~6px width
    + 5 to make sure there are extra symbols for ellipsis
    + 50 for resizing
  */
  return show.replaceAll('\n', ' ').slice(0, (size / 6) + 5 + 50)
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

export function getColumnUiType(column: typeof columnType.infer): Column['uiType'] {
  if (column.isArray)
    return 'list'

  if (column.enum)
    return 'select'

  if (column.type === 'boolean')
    return 'boolean'

  return 'raw'
}
