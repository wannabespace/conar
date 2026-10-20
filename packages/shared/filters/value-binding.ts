import { sql } from 'kysely'

import type { FilterValueBinding } from './kysely'

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

export const clickhouseFilterValues =
  (columns: ColumnTypes = []): FilterValueBinding =>
  (column, value) =>
    clickhouseDateTime(
      columns.find(({ id }) => id === column)?.type ?? '',
      value
    )

export const SQLITE_BOOLEAN_TYPE = /^boolean$/iu

// SQLite stores a boolean as 1 or 0, so the filter's `true` text never equals it.
export const sqliteFilterValues =
  (columns: ColumnTypes = []): FilterValueBinding =>
  (column, value) =>
    (value === 'true' || value === 'false') &&
    SQLITE_BOOLEAN_TYPE.test(
      columns.find(({ id }) => id === column)?.type ?? ''
    )
      ? Number(value === 'true')
      : value
