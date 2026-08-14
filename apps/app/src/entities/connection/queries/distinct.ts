import { type } from 'arktype'

import { createQuery } from '../runtime/query'

const distinctType = type('Record<string, unknown>[]')

export const distinctQuery = ({
  schema,
  table,
  column,
  limit = 1000,
}: {
  schema: string
  table: string
  column: string
  limit?: number
}) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        db
          .withSchema(schema)
          .$extendTables<Record<string, Record<string, unknown>>>()
          .selectFrom(table)
          .select(column)
          .distinct()
          .limit(limit)
          .execute(),
      mssql: (db) =>
        db
          .withSchema(schema)
          .$extendTables<Record<string, Record<string, unknown>>>()
          .selectFrom(table)
          .select(column)
          .distinct()
          .limit(limit)
          .execute(),
      mysql: (db) =>
        db
          .withSchema(schema)
          .$extendTables<Record<string, Record<string, unknown>>>()
          .selectFrom(table)
          .select(column)
          .distinct()
          .limit(limit)
          .execute(),
      postgres: (db) =>
        db
          .withSchema(schema)
          .$extendTables<Record<string, Record<string, unknown>>>()
          .selectFrom(table)
          .select(column)
          .distinct()
          .limit(limit)
          .execute(),
    },
    type: distinctType,
  })
