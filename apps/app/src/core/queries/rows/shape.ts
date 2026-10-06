import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { FilterValueBinding } from '@tamery/shared/filters'
import type { Expression, ExpressionBuilder, SqlBool } from 'kysely'
import { sql } from 'kysely'

import { capabilitiesOf } from '~/core/catalog/capabilities'

// oxlint-disable-next-line ts/no-explicit-any
type Eb = ExpressionBuilder<any, any>

export type ContainsText = (
  eb: Eb,
  column: string,
  pattern: string
) => Expression<SqlBool>

export const textContains: Record<ConnectionType, ContainsText> = {
  clickhouse: (eb, column, pattern) =>
    eb(eb.fn('toString', [eb.ref(column)]), 'ilike', pattern),
  // Default collations compare case-insensitively, so LIKE already ignores case.
  mssql: (eb, column, pattern) =>
    eb(eb.cast(eb.ref(column), sql`nvarchar(max)`), 'like', pattern),
  mysql: (eb, column, pattern) =>
    eb(eb.cast(eb.ref(column), 'char'), 'like', pattern),
  postgres: (eb, column, pattern) =>
    eb(eb.cast(eb.ref(column), 'text'), 'ilike', pattern),
}

export type ColumnTypes = { id: string; type?: string }[]

export type BindValue = (columnType: string, value: unknown) => unknown

const bindJsonAsText = (connectionType: ConnectionType): BindValue => {
  const { json } = capabilitiesOf(connectionType).columnTypes

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

const clickhouseJsonColumnType = capabilitiesOf(ConnectionType.ClickHouse)
  .columnTypes.json
const clickhouseDateTimeType = /\bDateTime(?:64\((?<precision>\d))?/u

// Reads come back ISO (`date_time_output_format`), which a DateTime comparison or cast cannot parse.
const clickhouseDateTime = (columnType: string, value: unknown) => {
  const dateTime =
    typeof value === 'string' && clickhouseDateTimeType.exec(columnType)
  return dateTime
    ? sql`parseDateTime64BestEffort(${value}, ${Number(dateTime.groups?.precision ?? 0)})`
    : value
}

/** How a value is written to, or matched against, a column of `columnType`; `undefined` is the column's DEFAULT. */
export const bindValue: Record<ConnectionType, BindValue> = {
  clickhouse: (columnType, value) => {
    if (value === undefined) {
      return sql`default`
    }
    if (value === null) {
      return value
    }
    // No string casts to a ClickHouse Map or Tuple; `format(JSONEachRow)` rejects a misfit where `JSONExtract` silently writes a default.
    if (clickhouseJsonColumnType.test(columnType)) {
      return sql`(select v from format(JSONEachRow, ${`v ${columnType}`}, ${`{"v":${JSON.stringify(value)}}`}))`
    }
    return clickhouseDateTime(columnType, value)
  },
  mssql: bindJsonAsText(ConnectionType.MSSQL),
  mysql: bindJsonAsText(ConnectionType.MySQL),
  postgres: bindJsonAsText(ConnectionType.Postgres),
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

// MSSQL caps a statement at 2100 bound parameters; the others comfortably take 500 rows per statement
const MSSQL_PARAMETER_LIMIT = 2000
const MAX_ROWS_PER_STATEMENT = 500

export const rowsPerStatement = (
  dialect: ConnectionType,
  valuesPerRow: number
) =>
  dialect === ConnectionType.MSSQL
    ? Math.max(
        1,
        Math.min(
          MAX_ROWS_PER_STATEMENT,
          Math.floor(MSSQL_PARAMETER_LIMIT / valuesPerRow)
        )
      )
    : MAX_ROWS_PER_STATEMENT
