import { type } from 'arktype'
import { createQuery } from '../query'

const distinctType = type('Record<string, unknown>[]')

export function distinctQuery({ schema, table, column, limit = 1000 }: {
  schema: string
  table: string
  column: string
  limit?: number
}) {
  return createQuery({
    type: distinctType,
    query: {
      postgres: db => db
        .withSchema(schema)
        .withTables<{ [table: string]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(column)
        .distinct()
        .limit(limit)
        .execute(),
      mysql: db => db
        .withSchema(schema)
        .withTables<{ [table: string]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(column)
        .distinct()
        .limit(limit)
        .execute(),
      mssql: db => db
        .withSchema(schema)
        .withTables<{ [table: string]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(column)
        .distinct()
        .limit(limit)
        .execute(),
      clickhouse: db => db
        .withSchema(schema)
        .withTables<{ [table: string]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(column)
        .distinct()
        .limit(limit)
        .execute(),
      duckdb: db => db
        .withSchema(schema)
        .withTables<{ [table: string]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(column)
        .distinct()
        .limit(limit)
        .execute(),
    },
  })
}
