import type { Kysely } from 'kysely'
import { memoize } from 'memoza'

import { createQuery } from '../../runtime/query'

const DELETE_BATCH_SIZE = 500

interface DeleteParams {
  table: string
  schema: string
  primaryKeys: Record<string, unknown>[]
}

const deleteInBatches = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  { table, schema, primaryKeys }: DeleteParams
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
        .where(({ or, and, eb }) =>
          or(
            primaryKeys
              .slice(index, index + DELETE_BATCH_SIZE)
              .map((pk) =>
                and(
                  Object.entries(pk).map(([key, value]) => eb(key, '=', value))
                )
              )
          )
        )
        .execute()
    }
  })

export const deleteRowsQuery = memoize((params: DeleteParams) =>
  createQuery({
    query: {
      clickhouse: (db) => deleteInBatches(db, params),
      mssql: (db) => deleteInBatches(db, params),
      mysql: (db) => deleteInBatches(db, params),
      postgres: (db) => deleteInBatches(db, params),
    },
  })
)
