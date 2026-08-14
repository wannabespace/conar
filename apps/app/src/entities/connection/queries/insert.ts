import { createQuery } from '../runtime/query'

export const insertQuery = ({
  schema,
  table,
  rows,
}: {
  schema: string
  table: string
  rows: Record<string, unknown>[]
}) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        db
          .withSchema(schema)
          .$extendTables<Record<string, Record<string, unknown>>>()
          .insertInto(table)
          .values(rows)
          .execute(),
      mssql: (db) =>
        db
          .withSchema(schema)
          .$extendTables<Record<string, Record<string, unknown>>>()
          .insertInto(table)
          .values(rows)
          .execute(),
      mysql: (db) =>
        db
          .withSchema(schema)
          .$extendTables<Record<string, Record<string, unknown>>>()
          .insertInto(table)
          .values(rows)
          .execute(),
      postgres: (db) =>
        db
          .withSchema(schema)
          .$extendTables<Record<string, Record<string, unknown>>>()
          .insertInto(table)
          .values(rows)
          .execute(),
    },
  })
