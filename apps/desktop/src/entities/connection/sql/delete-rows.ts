import { createQuery } from '../query'

export const deleteRowsQuery = createQuery({
  query: ({ table, schema, primaryKeys }: {
    table: string
    schema: string
    primaryKeys: Record<string, unknown>[]
  }) => {
    const pgLike = (db: Parameters<ReturnType<Parameters<typeof createQuery>[0]['query']>['postgres']>[0]) =>
      db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .deleteFrom(table)
        .where(({ or, and, eb }) => or(primaryKeys.map(pk => and(
          Object.entries(pk).map(([key, value]) => eb(key, '=', value)),
        ))))
        .execute()
    return {
      postgres: pgLike,
      supabase: pgLike,
      mysql: db => db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .deleteFrom(table)
        .where(({ or, and, eb }) => or(primaryKeys.map(pk => and(
          Object.entries(pk).map(([key, value]) => eb(key, '=', value)),
        ))))
        .execute(),
      mssql: db => db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .deleteFrom(table)
        .where(({ or, and, eb }) => or(primaryKeys.map(pk => and(
          Object.entries(pk).map(([key, value]) => eb(key, '=', value)),
        ))))
        .execute(),
      clickhouse: db => db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .deleteFrom(table)
        .where(({ or, and, eb }) => or(primaryKeys.map(pk => and(
          Object.entries(pk).map(([key, value]) => eb(key, '=', value)),
        ))))
        .execute(),
    }
  },
})
