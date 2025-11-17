import type { databases } from '~/drizzle'
import { runSql } from '../query'

const label = 'Rename Table'

export function renameTableSql(database: typeof databases.$inferSelect, { schema, oldTable, newTable }: { schema: string, oldTable: string, newTable: string }) {
  return runSql(database, {
    query: {
      postgres: ({ qb, execute, log }) => {
        const query = qb
          .withSchema(schema)
          .withTables<{ [oldTable]: Record<string, unknown> }>()
          .schema
          .alterTable(oldTable)
          .renameTo(newTable)
          .compile()

        const promise = execute(query)

        log({ ...query, promise, label })

        return promise
      },
      mysql: ({ qb, execute, log }) => {
        const query = qb
          .withSchema(schema)
          .withTables<{ [oldTable]: Record<string, unknown> }>()
          .schema
          .alterTable(oldTable)
          .renameTo(newTable)
          .compile()

        const promise = execute(query)

        log({ ...query, promise, label })

        return promise
      },
    },
  })
}
