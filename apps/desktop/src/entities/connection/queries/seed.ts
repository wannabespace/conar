import { createQuery } from '../query'

export function insertQuery({ schema, table, rows }: {
  schema: string
  table: string
  rows: Record<string, unknown>[]
}) {
  return createQuery({
    query: {
      postgres: db => db
        .withSchema(schema)
        .withTables<{ [table: string]: Record<string, unknown> }>()
        .insertInto(table)
        .values(rows)
        .execute(),
      mysql: db => db
        .withSchema(schema)
        .withTables<{ [table: string]: Record<string, unknown> }>()
        .insertInto(table)
        .values(rows)
        .execute(),
      mssql: db => db
        .withSchema(schema)
        .withTables<{ [table: string]: Record<string, unknown> }>()
        .insertInto(table)
        .values(rows)
        .execute(),
      clickhouse: db => db
        .withSchema(schema)
        .withTables<{ [table: string]: Record<string, unknown> }>()
        .insertInto(table)
        .values(rows)
        .execute(),
      duckdb: db => db
        .withSchema(schema)
        .withTables<{ [table: string]: Record<string, unknown> }>()
        .insertInto(table)
        .values(rows)
        .execute(),
    },
  })
}
