import { Dialect } from '@tamery/shared/enums/connection-type'
import type { Kysely } from 'kysely'
import { memoize } from 'memoza'

import { createQuery } from '~/core/runtime/query'

import type { BindValue, ColumnTypes } from './shape'
import {
  bindValue,
  clickhouseWrite,
  rowsPerStatement,
  matchesPrimaryKeys,
} from './shape'

interface DeleteParams {
  table: string
  schema: string
  columns: ColumnTypes
  primaryKeys: Record<string, unknown>[]
}

const deleteInBatches = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  bind: BindValue,
  batchSize: number,
  { table, schema, columns, primaryKeys }: DeleteParams
) =>
  db.transaction().execute(async (trx) => {
    for (let index = 0; index < primaryKeys.length; index += batchSize) {
      // oxlint-disable-next-line no-await-in-loop
      await trx
        .withSchema(schema)
        .$extendTables<Record<string, Record<string, unknown>>>()
        .deleteFrom(table)
        .where((eb) =>
          eb.or(
            primaryKeys
              .slice(index, index + batchSize)
              .map((pk) => matchesPrimaryKeys(eb, bind, columns, pk))
          )
        )
        .execute()
    }
  })

export const deleteRowsQuery = memoize((params: DeleteParams) => {
  const keyWidth = Object.keys(params.primaryKeys[0] ?? {}).length
  return createQuery({
    query: {
      clickhouse: (db) =>
        clickhouseWrite((bind) =>
          deleteInBatches(
            db,
            bind,
            rowsPerStatement(Dialect.ClickHouse, keyWidth),
            params
          )
        ),
      mssql: (db) =>
        deleteInBatches(
          db,
          bindValue.mssql,
          rowsPerStatement(Dialect.MSSQL, keyWidth),
          params
        ),
      mysql: (db) =>
        deleteInBatches(
          db,
          bindValue.mysql,
          rowsPerStatement(Dialect.MySQL, keyWidth),
          params
        ),
      oracle: (db) =>
        deleteInBatches(
          db,
          bindValue.oracle,
          rowsPerStatement(Dialect.Oracle, keyWidth),
          params
        ),
      postgres: (db) =>
        deleteInBatches(
          db,
          bindValue.postgres,
          rowsPerStatement(Dialect.Postgres, keyWidth),
          params
        ),
      sqlite: (db) =>
        deleteInBatches(
          db,
          bindValue.sqlite,
          rowsPerStatement(Dialect.SQLite, keyWidth),
          params
        ),
    },
  })
})
