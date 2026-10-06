import { type } from 'arktype'
import type { Kysely } from 'kysely'

import { createQuery } from '~/core/runtime/query'

const distinctType = type('Record<string, unknown>[]')

interface DistinctParams {
  schema: string
  table: string
  column: string
}

const selectDistinct = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  { schema, table, column }: DistinctParams
) =>
  db
    .withSchema(schema)
    .$extendTables<Record<string, Record<string, unknown>>>()
    .selectFrom(table)
    .select(column)
    .distinct()
    .limit(1000)
    .execute()

export const distinctQuery = (params: DistinctParams) =>
  createQuery({
    query: {
      clickhouse: (db) => selectDistinct(db, params),
      mssql: (db) => selectDistinct(db, params),
      mysql: (db) => selectDistinct(db, params),
      postgres: (db) => selectDistinct(db, params),
    },
    type: distinctType,
  })
