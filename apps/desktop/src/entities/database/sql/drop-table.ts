import { createQuery } from '../query'

export const dropTableQuery = createQuery({
  query: ({ table, schema, cascade }: { table: string; schema: string; cascade: boolean }) => ({
    postgres: (db) => {
      let query = db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .schema.dropTable(table)

      if (cascade) {
        query = query.cascade()
      }

      return query.execute()
    },
    mysql: (db) => {
      let query = db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .schema.dropTable(table)

      if (cascade) {
        query = query.cascade()
      }

      return query.execute()
    },
    mssql: (db) => {
      let query = db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .schema.dropTable(table)

      if (cascade) {
        query = query.cascade()
      }

      return query.execute()
    },
    clickhouse: (db) =>
      db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .schema.dropTable(table)
        .execute(),
  }),
})
