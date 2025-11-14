import type { databases } from '~/drizzle'
import { runSql } from '../query'

export function renameTableSql(database: typeof databases.$inferSelect, { schema, oldTable, newTable }: { schema: string, oldTable: string, newTable: string }) {
  return runSql({
    database,
    label: 'Rename Table',
    query: {
      postgres: db => db
        .withSchema(schema)
        .withTables<{ [oldTable]: Record<string, unknown> }>()
        .schema
        .alterTable(oldTable)
        .renameTo(newTable)
        .compile(),
      mysql: db => db
        .withSchema(schema)
        .withTables<{ [oldTable]: Record<string, unknown> }>()
        .schema
        .alterTable(oldTable)
        .renameTo(newTable)
        .compile(),
    },
  })
}
