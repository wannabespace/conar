import type { databases } from '~/drizzle'
import { runSql } from '../query'

export function dropTableSql(database: typeof databases.$inferSelect, { table, schema, cascade }: { table: string, schema: string, cascade: boolean }) {
  const label = `Drop Table ${schema}.${table}`

  return runSql(database, {
    query: {
      postgres: ({ qb, execute, log }) => {
        let query = qb
          .withSchema(schema)
          .withTables<{ [table]: Record<string, unknown> }>()
          .schema
          .dropTable(table)

        if (cascade) {
          query = query.cascade()
        }

        const compiledQuery = query.compile()

        const promise = execute(compiledQuery)

        log({ ...compiledQuery, promise, label })

        return promise
      },
      mysql: ({ qb, execute, log }) => {
        let query = qb
          .withSchema(schema)
          .withTables<{ [table]: Record<string, unknown> }>()
          .schema
          .dropTable(table)

        if (cascade) {
          query = query.cascade()
        }

        const compiledQuery = query.compile()

        const promise = execute(compiledQuery)

        log({ ...compiledQuery, promise, label })

        return promise
      },
    },
  })
}
