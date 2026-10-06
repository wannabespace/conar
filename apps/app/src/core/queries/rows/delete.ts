import type { Kysely } from 'kysely'
import { memoize } from 'memoza'

import { createQuery } from '~/core/runtime/query'

import type { BindValue, ColumnTypes } from './shape'
import { bindValue, matchesPrimaryKeys } from './shape'

const DELETE_BATCH_SIZE = 500

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
  { table, schema, columns, primaryKeys }: DeleteParams
) =>
  db.transaction().execute(async (trx) => {
    for (
      let index = 0;
      index < primaryKeys.length;
      index += DELETE_BATCH_SIZE
    ) {
      // oxlint-disable-next-line no-await-in-loop
      await trx
        .withSchema(schema)
        .$extendTables<Record<string, Record<string, unknown>>>()
        .deleteFrom(table)
        .where((eb) =>
          eb.or(
            primaryKeys
              .slice(index, index + DELETE_BATCH_SIZE)
              .map((pk) => matchesPrimaryKeys(eb, bind, columns, pk))
          )
        )
        .execute()
    }
  })

export const deleteRowsQuery = memoize((params: DeleteParams) =>
  createQuery({
    query: {
      clickhouse: (db) => deleteInBatches(db, bindValue.clickhouse, params),
      mssql: (db) => deleteInBatches(db, bindValue.mssql, params),
      mysql: (db) => deleteInBatches(db, bindValue.mysql, params),
      postgres: (db) => deleteInBatches(db, bindValue.postgres, params),
    },
  })
)
