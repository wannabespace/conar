import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { Kysely } from 'kysely'
import { memoize } from 'memoza'

import { createQuery } from '~/core/runtime/query'

import type { BindValue, ColumnTypes } from './shape'
import { bindValue, rowsPerStatement, matchesPrimaryKeys } from './shape'

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
        deleteInBatches(
          db,
          bindValue.clickhouse,
          rowsPerStatement(ConnectionType.ClickHouse, keyWidth),
          params
        ),
      mssql: (db) =>
        deleteInBatches(
          db,
          bindValue.mssql,
          rowsPerStatement(ConnectionType.MSSQL, keyWidth),
          params
        ),
      mysql: (db) =>
        deleteInBatches(
          db,
          bindValue.mysql,
          rowsPerStatement(ConnectionType.MySQL, keyWidth),
          params
        ),
      postgres: (db) =>
        deleteInBatches(
          db,
          bindValue.postgres,
          rowsPerStatement(ConnectionType.Postgres, keyWidth),
          params
        ),
    },
  })
})
