import { createQuery } from '../runtime/query'

export function insertQuery({
  schema,
  table,
  rows,
}: {
  schema: string
  table: string
  rows: Record<string, unknown>[]
}) {
  return createQuery({
    query: {
      postgres: db =>
        db
          .withSchema(schema)
          .$extendTables<{ [table: string]: Record<string, unknown> }>()
          .insertInto(table)
          .values(rows)
          .execute(),
      mysql: db =>
        db
          .withSchema(schema)
          .$extendTables<{ [table: string]: Record<string, unknown> }>()
          .insertInto(table)
          .values(rows)
          .execute(),
      mssql: db =>
        db
          .withSchema(schema)
          .$extendTables<{ [table: string]: Record<string, unknown> }>()
          .insertInto(table)
          .values(rows)
          .execute(),
      clickhouse: db =>
        db
          .withSchema(schema)
          .$extendTables<{ [table: string]: Record<string, unknown> }>()
          .insertInto(table)
          .values(rows)
          .execute(),
    },
  })
}
