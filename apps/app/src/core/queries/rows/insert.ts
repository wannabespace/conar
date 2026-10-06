import type { Kysely } from 'kysely'

import { createQuery } from '~/core/runtime/query'

import { insertRows } from './shape'

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
      await insertRows(
        trx,
        { schema, table },
        rows.slice(index, index + batchSize)
      )
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
