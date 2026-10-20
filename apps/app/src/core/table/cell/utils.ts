import type { Dialect } from '@tamery/shared/enums/connection-type'
import { DEFAULT_COLUMN_WIDTH } from '@tamery/table/constants'
import { format } from 'date-fns'

import { getCapabilities } from '~/core/catalog/capabilities'
import type { columnType } from '~/core/queries/tables/columns'

export interface Column extends Partial<
  Pick<
    typeof columnType.infer,
    'attributes' | 'collation' | 'comment' | 'declaredType'
  >
> {
  id: string
  uiType: 'select' | 'list' | 'boolean' | 'date' | 'time' | 'datetime' | 'raw'
  type?: string
  typeLabel?: string
  declaredType?: string | null
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

export const TIME_FORMATS: Partial<Record<Column['uiType'], string>> = {
  date: 'yyyy-MM-dd',
  datetime: 'yyyy-MM-dd HH:mm:ss',
  time: 'HH:mm:ss',
}

/** Local wall-clock text, with the offset only where the column stores a time zone. */
export const formatColumnTime = (
  date: Date,
  pattern: string,
  column: Column,
  dialect: Dialect
) =>
  format(
    date,
    getCapabilities(dialect).columnTypes.zoned?.test(column.type ?? '')
      ? `${pattern}xxx`
      : pattern
  )

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
  dialect: Dialect,
  column: typeof columnType.infer
): Column['uiType'] => {
  if (column.isArray) {
    return 'list'
  }

  if (column.enumName) {
    return 'select'
  }

  if (getCapabilities(dialect).columnTypes.boolean?.test(column.typeLabel)) {
    return 'boolean'
  }

  if (column.type.toLowerCase().includes('range')) {
    return 'raw'
  }

  if (
    column.type.toLowerCase().includes('datetime') ||
    column.type.toLowerCase().includes('timestamp') ||
    getCapabilities(dialect).columnTypes.datesWithTime?.test(column.type)
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

export const isNumericColumn = (column: Column) =>
  column.uiType === 'raw' && NUMERIC_TYPE_REGEX.test(column.type ?? '')

export const hasTabularFigures = (column: Column) =>
  column.uiType !== 'raw' || isNumericColumn(column)

export const canWriteDefault = (dialect: Dialect, column: Column) =>
  getCapabilities(dialect).setDefault &&
  column.defaultValue !== null &&
  column.defaultValue !== undefined
