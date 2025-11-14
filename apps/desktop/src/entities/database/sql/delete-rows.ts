import type { databases } from '~/drizzle'
import { runSql } from '../query'

export function deleteRowsSql(database: typeof databases.$inferSelect, { table, schema, primaryKeys }: {
  table: string
  schema: string
  // [{ id: 1, email: 'test@test.com' }, { id: 2, email: 'test2@test.com' }]
  primaryKeys: Record<string, unknown>[]
}) {
  return runSql({
    database,
    label: `Delete Rows ${schema}.${table}`,
    query: {
      postgres: db => db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .deleteFrom(table)
        .where(({ or, and, eb }) => or(primaryKeys.map(pk => and(
          Object.entries(pk).map(([key, value]) => eb(key, '=', value)),
        ))))
        .compile(),
      mysql: db => db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .deleteFrom(table)
        .where(({ or, and, eb }) => or(primaryKeys.map(pk => and(
          Object.entries(pk).map(([key, value]) => eb(key, '=', value)),
        ))))
        .compile(),
    },
  })
}
