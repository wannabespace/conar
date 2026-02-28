import { createQuery } from '../query'

export const dropTableQuery = createQuery({
  query: ({ table, schema, cascade }: { table: string, schema: string, cascade: boolean }) => {
    const pgLike = (db: Parameters<ReturnType<Parameters<typeof createQuery>[0]['query']>['postgres']>[0]) => {
      let q = db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .schema
        .dropTable(table)
      if (cascade)
        q = q.cascade()
      return q.execute()
    }
    return {
      postgres: pgLike,
      supabase: pgLike,
      mysql: (db) => {
        let query = db
          .withSchema(schema)
          .withTables<{ [table]: Record<string, unknown> }>()
          .schema
          .dropTable(table)

        if (cascade) {
          query = query.cascade()
        }

        return query.execute()
      },
      mssql: (db) => {
        let query = db
          .withSchema(schema)
          .withTables<{ [table]: Record<string, unknown> }>()
          .schema
          .dropTable(table)

        if (cascade) {
          query = query.cascade()
        }

        return query.execute()
      },
      clickhouse: db => db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .schema
        .dropTable(table)
        .execute(),
    }
  },
})
