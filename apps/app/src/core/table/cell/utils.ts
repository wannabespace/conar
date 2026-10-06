import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { DEFAULT_COLUMN_WIDTH } from '@tamery/table/constants'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import type { columnType } from '~/core/queries/tables/columns'

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
  isGenerated?: boolean
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

  // Postgres `daterange` holds bounds like `[2026-01-01,2026-02-01)`, not a date.
  if (column.type.toLowerCase().includes('range')) {
    return 'raw'
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

const NUMERIC_TYPE_REGEX =
  /^(?:u?int\d*|tinyint|smallint|mediumint|bigint|integer|numeric|decimal|float\d*|double|real|money|smallmoney|serial|bigserial|smallserial|number)\b/iu

// Casting anything else to text can fail (SQL Server `image`, spatial types) and nobody searches or reads it as words.
const TEXT_TYPE = /char|text|uuid|string|enum|name/iu

export const isTextType = (type: string | undefined) =>
  TEXT_TYPE.test(type ?? '')

export const isNumericColumn = (column: Column) =>
  column.uiType === 'raw' && NUMERIC_TYPE_REGEX.test(column.type ?? '')

export const hasTabularFigures = (column: Column) =>
  column.uiType !== 'raw' || isNumericColumn(column)

export const canWriteDefault = (
  connectionType: ConnectionType,
  column: Column
) =>
  capabilitiesOf(connectionType).setDefault &&
  column.defaultValue !== null &&
  column.defaultValue !== undefined
