import type { databases } from '~/drizzle'
import { runSql } from '../query'

export function dropTableSql(database: typeof databases.$inferSelect, { table, schema, cascade }: { table: string, schema: string, cascade: boolean }) {
  return runSql({
    database,
    label: `Drop Table ${schema}.${table}`,
    query: {
      postgres: (db) => {
        let query = db
          .withSchema(schema)
          .withTables<{ [table]: Record<string, unknown> }>()
          .schema
          .dropTable(table)

        if (cascade) {
          query = query.cascade()
        }

        return query.compile()
      },
      mysql: (db) => {
        let query = db
          .withSchema(schema)
          .withTables<{ [table]: Record<string, unknown> }>()
          .schema
          .dropTable(table)

        if (cascade) {
          query = query.cascade()
        }

        return query.compile()
      },
    },
  })
}
