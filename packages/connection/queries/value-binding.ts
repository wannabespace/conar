import type { Dialect } from '@tamery/shared/enums/connection-type'
import type { FilterValueBinding } from '@tamery/shared/filters'
import { sql } from 'kysely'

export type ColumnTypes = { id: string; type?: string }[]

const clickhouseDateTimeType = /\bDateTime(?:64\((?<precision>\d))?/u

// Reads come back ISO (`date_time_output_format`), which a DateTime comparison or cast cannot parse.
export const clickhouseDateTime = (columnType: string, value: unknown) => {
  const dateTime =
    typeof value === 'string' && clickhouseDateTimeType.exec(columnType)
  return dateTime
    ? sql`parseDateTime64BestEffort(${value}, ${Number(dateTime.groups?.precision ?? 0)})`
    : value
}

export const SQLITE_BOOLEAN_TYPE = /^boolean$/iu

const getColumnType = (columns: ColumnTypes, column: string) =>
  columns.find(({ id }) => id === column)?.type ?? ''

export const filterValueBindings: Partial<
  Record<Dialect, (columns: ColumnTypes) => FilterValueBinding>
> = {
  clickhouse: (columns) => (column, value) =>
    clickhouseDateTime(getColumnType(columns, column), value),
  // SQLite stores a boolean as 1 or 0, so the filter's `true` text never equals it.
  sqlite: (columns) => (column, value) =>
    (value === 'true' || value === 'false') &&
    SQLITE_BOOLEAN_TYPE.test(getColumnType(columns, column))
      ? Number(value === 'true')
      : value,
}
