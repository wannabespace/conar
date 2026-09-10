import type { Kysely } from 'kysely'

import { createQuery } from '../runtime/query'

interface InsertParams {
  schema: string
  table: string
  rows: Record<string, unknown>[]
  batchSize: number
}

const insertInBatches = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  { schema, table, rows, batchSize }: InsertParams
) =>
  db.transaction().execute(async (trx) => {
    for (let index = 0; index < rows.length; index += batchSize) {
      // oxlint-disable-next-line no-await-in-loop
      await trx
        .withSchema(schema)
        .$extendTables<Record<string, Record<string, unknown>>>()
        .insertInto(table)
        .values(rows.slice(index, index + batchSize))
        .execute()
    }
  })

export const insertQuery = (params: InsertParams) =>
  createQuery({
    query: {
      clickhouse: (db) => insertInBatches(db, params),
      mssql: (db) => insertInBatches(db, params),
      mysql: (db) => insertInBatches(db, params),
      postgres: (db) => insertInBatches(db, params),
    },
  })
