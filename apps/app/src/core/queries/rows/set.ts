import type { Kysely } from 'kysely'

import { createQuery } from '~/core/runtime/query'

import type { BindValue, ColumnTypes } from './shape'
import {
  bindRow,
  bindValue,
  clickhouseWrite,
  matchesPrimaryKeys,
} from './shape'

interface SetParams {
  schema: string
  table: string
  columns: ColumnTypes
  primaryKeys: Record<string, unknown>
  /** An `undefined` value sets the column's DEFAULT. */
  values: Record<string, unknown>
}

const updateRow = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  bind: BindValue,
  { schema, table, columns, primaryKeys, values }: SetParams
) =>
  db
    .withSchema(schema)
    .$extendTables<Record<string, Record<string, unknown>>>()
    .updateTable(table)
    .set(bindRow(bind, columns, values))
    .where((eb) => matchesPrimaryKeys(eb, bind, columns, primaryKeys))
    .execute()

export const setQuery = (params: SetParams) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        clickhouseWrite((bind) => updateRow(db, bind, params)),
      mssql: (db) => updateRow(db, bindValue.mssql, params),
      mysql: (db) => updateRow(db, bindValue.mysql, params),
      oracle: (db) => updateRow(db, bindValue.oracle, params),
      postgres: (db) => updateRow(db, bindValue.postgres, params),
      sqlite: (db) => updateRow(db, bindValue.sqlite, params),
    },
  })
