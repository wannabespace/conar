import type { ActiveFilter } from '@tamery/shared/filters'
import { DEFAULT_COLUMN_WIDTH } from '@tamery/table/constants'

import type { columnType } from '~/entities/connection/queries/columns'

export interface Column {
  id: string
  uiType: 'select' | 'list' | 'boolean' | 'date' | 'time' | 'datetime' | 'raw'
  type?: string
  typeLabel?: string
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
  isIdentity?: boolean
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
  ACTIONS: ACTIONS_COLUMN_ID,
  SELECT: SELECT_COLUMN_ID,
}

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

export const getColumnUiType = (
  column: typeof columnType.infer
): Column['uiType'] => {
  if (column.isArray) {
    return 'list'
  }

  if (column.enumName) {
    return 'select'
  }

  if (column.type === 'boolean') {
    return 'boolean'
  }

  if (
    column.type.toLowerCase().includes('datetime') ||
    column.type.toLowerCase().includes('timestamp')
  ) {
    return 'datetime'
  }

  if (column.type.toLowerCase().includes('date')) {
    return 'date'
  }

  if (column.type.toLowerCase().includes('time')) {
    return 'time'
  }

  return 'raw'
}

export interface ColumnHandlers {
  onQueueValue?: (rowIndex: number, newValue: unknown) => void
  onAddFilter?: (filter: ActiveFilter) => void
  onOrder?: (order?: 'ASC' | 'DESC' | null) => void
  onResize?: (newWidth: number) => void
  onRename?: () => void
}

// Compact cell-editor sizing: estimate rendered lines (long lines wrap)
const COMPACT_CHARS_PER_LINE = 48
const COMPACT_LINE_HEIGHT = 20
// monaco top/bottom padding + breathing room
const COMPACT_VERTICAL_CHROME = 36
const COMPACT_MIN_HEIGHT = 56
const COMPACT_MAX_HEIGHT = 160

export const estimateCompactHeight = (text: string) => {
  const lines = text
    .split('\n')
    .reduce(
      (total, line) =>
        total + Math.max(1, Math.ceil(line.length / COMPACT_CHARS_PER_LINE)),
      0
    )

  return Math.min(
    COMPACT_MAX_HEIGHT,
    Math.max(
      COMPACT_MIN_HEIGHT,
      lines * COMPACT_LINE_HEIGHT + COMPACT_VERTICAL_CHROME
    )
  )
}
