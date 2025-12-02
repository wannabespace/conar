import { createQuery } from '../query'

export const deleteRowsQuery = createQuery({
  query: ({ table, schema, primaryKeys }: {
    table: string
    schema: string
    // [{ id: 1, email: 'test@test.com' }, { id: 2, email: 'test2@test.com' }]
    primaryKeys: Record<string, unknown>[]
  }) => ({
    postgres: db => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .deleteFrom(table)
      .where(({ or, and, eb }) => or(primaryKeys.map(pk => and(
        Object.entries(pk).map(([key, value]) => eb(key, '=', value)),
      ))))
      .execute(),
    mysql: db => db
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
  }),
})
