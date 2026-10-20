import { Dialect } from '@tamery/shared/enums/connection-type'
import type { FilterValueBinding } from '@tamery/shared/filters'
import type { Expression, ExpressionBuilder, SqlBool } from 'kysely'
import { sql } from 'kysely'

import { getCapabilities } from '~/core/catalog/capabilities'

// oxlint-disable-next-line ts/no-explicit-any
type Eb = ExpressionBuilder<any, any>

export type ContainsText = (
  eb: Eb,
  column: string,
  pattern: string
) => Expression<SqlBool>

export const textContains: Record<Dialect, ContainsText> = {
  clickhouse: (eb, column, pattern) =>
    eb(eb.fn('toString', [eb.ref(column)]), 'ilike', pattern),
  mssql: (eb, column, pattern) =>
    eb(eb.cast(eb.ref(column), sql`nvarchar(max)`), 'like', pattern),
  mysql: (eb, column, pattern) =>
    eb(eb.cast(eb.ref(column), 'char'), 'like', pattern),
  oracle: (eb, column, pattern) =>
    eb(
      eb.fn('upper', [eb.ref(column)]),
      'like',
      eb.fn('upper', [eb.val(pattern)])
    ),
  postgres: (eb, column, pattern) =>
    eb(eb.cast(eb.ref(column), 'text'), 'ilike', pattern),
  sqlite: (eb, column, pattern) =>
    eb(eb.cast(eb.ref(column), 'text'), 'like', pattern),
}

export type ColumnTypes = { id: string; type?: string }[]

export type BindValue = (columnType: string, value: unknown) => unknown

const bindJsonAsText = (dialect: Dialect): BindValue => {
  const { json } = getCapabilities(dialect).columnTypes

  return (columnType, value) => {
    if (value === undefined) {
      return sql`default`
    }
    // Drafts hold parsed json like driver values do; bound as is, an array would become a SQL array and a string invalid json.
    return value !== null && json.test(columnType)
      ? JSON.stringify(value)
      : value
  }
}

const clickhouseJsonColumnType = getCapabilities(Dialect.ClickHouse).columnTypes
  .json
const clickhouseDateTimeType = /\bDateTime(?:64\((?<precision>\d))?/u

// Reads come back ISO (`date_time_output_format`), which a DateTime comparison or cast cannot parse.
const clickhouseDateTime = (columnType: string, value: unknown) => {
  const dateTime =
    typeof value === 'string' && clickhouseDateTimeType.exec(columnType)
  return dateTime
    ? sql`parseDateTime64BestEffort(${value}, ${Number(dateTime.groups?.precision ?? 0)})`
    : value
}

const clickhouseBind =
  (parseJson: (columnType: string, json: string) => unknown): BindValue =>
  (columnType, value) => {
    if (value === undefined) {
      return sql`default`
    }
    if (value === null) {
      return value
    }
    // No string casts to a ClickHouse Map or Tuple.
    if (clickhouseJsonColumnType.test(columnType)) {
      return parseJson(columnType, `{"v":${JSON.stringify(value)}}`)
    }
    return clickhouseDateTime(columnType, value)
  }

const bindOracleJson = bindJsonAsText(Dialect.Oracle)
const oracleDateTimeType = /^(?:DATE|TIMESTAMP)\b/iu
// The session's NLS formats put a space between date and time, so ISO's T fails with ORA-01861.
const ISO_TIME_SEPARATOR = /(?<=^\d{4}-\d{2}-\d{2})T/u

/** `undefined` binds the column's DEFAULT. */
export const bindValue: Record<Dialect, BindValue> = {
  clickhouse: clickhouseBind(
    (columnType, json) =>
      sql`(select v from format(JSONEachRow, ${`v ${columnType}`}, ${json}))`
  ),
  mssql: bindJsonAsText(Dialect.MSSQL),
  mysql: bindJsonAsText(Dialect.MySQL),
  oracle: (columnType, value) => {
    const bound = bindOracleJson(columnType, value)
    return typeof bound === 'string' && oracleDateTimeType.test(columnType)
      ? bound.replace(ISO_TIME_SEPARATOR, ' ')
      : bound
  },
  postgres: bindJsonAsText(Dialect.Postgres),
  sqlite: bindJsonAsText(Dialect.SQLite),
}

const NO_FORMAT_FUNCTION = /Unknown table function format\b/u

// ClickHouse 21.12 has no `format()`. There only `JSONExtract` parses a value, and it writes the type's default for a misfit where `format(JSONEachRow)` rejects it.
const bindClickhouseWithoutFormat = clickhouseBind(
  (columnType, json) => sql`JSONExtract(${json}, 'v', ${columnType})`
)

/** Retries once with the `JSONExtract` binder, so `write` must be a single statement or fail before its first one runs. */
export const clickhouseWrite = async <T>(
  write: (bind: BindValue) => Promise<T>
) => {
  try {
    return await write(bindValue.clickhouse)
  } catch (error) {
    if (!(error instanceof Error && NO_FORMAT_FUNCTION.test(error.message))) {
      throw error
    }
    return write(bindClickhouseWithoutFormat)
  }
}

export const bindRow = (
  bind: BindValue,
  columns: ColumnTypes,
  row: Record<string, unknown>
) =>
  Object.fromEntries(
    Object.entries(row).map(([id, value]) => [
      id,
      bind(columns.find((column) => column.id === id)?.type ?? '', value),
    ])
  )

export const matchesPrimaryKeys = (
  eb: Eb,
  bind: BindValue,
  columns: ColumnTypes,
  primaryKeys: Record<string, unknown>
) =>
  eb.and(
    Object.entries(bindRow(bind, columns, primaryKeys)).map(([id, value]) =>
      eb(id, '=', value)
    )
  )

export const clickhouseFilterValues =
  (columns: ColumnTypes = []): FilterValueBinding =>
  (column, value) =>
    clickhouseDateTime(
      columns.find(({ id }) => id === column)?.type ?? '',
      value
    )

const sqliteBooleanType = getCapabilities(Dialect.SQLite).columnTypes.boolean

// SQLite stores a boolean as 1 or 0, so the filter's `true` text never equals it.
export const sqliteFilterValues =
  (columns: ColumnTypes = []): FilterValueBinding =>
  (column, value) =>
    (value === 'true' || value === 'false') &&
    sqliteBooleanType?.test(columns.find(({ id }) => id === column)?.type ?? '')
      ? Number(value === 'true')
      : value

// SQL Server caps a statement at 2100 bound parameters, Cloudflare D1 (the tightest SQLite location) at 100.
const PARAMETER_LIMITS: Partial<Record<Dialect, number>> = {
  mssql: 2000,
  sqlite: 100,
}
const MAX_ROWS_PER_STATEMENT = 500

export const rowsPerStatement = (dialect: Dialect, valuesPerRow: number) =>
  Math.max(
    1,
    Math.min(
      MAX_ROWS_PER_STATEMENT,
      Math.floor((PARAMETER_LIMITS[dialect] ?? Infinity) / valuesPerRow)
    )
  )
