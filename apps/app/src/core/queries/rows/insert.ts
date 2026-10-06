import type { InsertQueryBuilder, Kysely } from 'kysely'
import { sql } from 'kysely'

import { createQuery } from '~/core/runtime/query'

import type { BindValue, ColumnTypes } from './shape'
import { bindRow, bindValue } from './shape'

interface InsertParams {
  schema: string
  table: string
  columns: ColumnTypes
  /** A missing or `undefined` value is the column's DEFAULT. */
  rows: Record<string, unknown>[]
}

// oxlint-disable-next-line ts/no-explicit-any
type Into = InsertQueryBuilder<any, any, any>

const definedValues = (row: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined)
  )

const insertRows = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  bind: BindValue,
  // Writes one row: only a lone row is ever all defaults, since a seed always generates a column.
  insertDefaultRow: (into: Into) => Into,
  { schema, table, columns, rows }: InsertParams
) => {
  const into = db
    .withSchema(schema)
    .$extendTables<Record<string, Record<string, unknown>>>()
    .insertInto(table)
  const values = rows.map((row) => bindRow(bind, columns, definedValues(row)))

  return (
    values.some((row) => Object.keys(row).length > 0)
      ? into.values(values)
      : insertDefaultRow(into)
  ).execute()
}

export const insertQuery = (params: InsertParams) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        insertRows(
          db,
          bindValue.clickhouse,
          (into) =>
            into.values(
              Object.fromEntries(
                params.columns.slice(0, 1).map(({ id }) => [id, sql`default`])
              )
            ),
          params
        ),
      mssql: (db) =>
        insertRows(db, bindValue.mssql, (into) => into.defaultValues(), params),
      mysql: (db) =>
        insertRows(db, bindValue.mysql, (into) => into.values({}), params),
      postgres: (db) =>
        insertRows(
          db,
          bindValue.postgres,
          (into) => into.defaultValues(),
          params
        ),
    },
  })
