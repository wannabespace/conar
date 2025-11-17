import type { ActiveFilter } from '@conar/shared/filters'
import type { databases } from '~/drizzle'
import { runSql } from '../query'
import { buildWhere } from './rows'

export function setSql(database: typeof databases.$inferSelect, {
  schema,
  table,
  values,
  filters,
}: { schema: string, table: string, values: Record<string, unknown>, filters: ActiveFilter[] }) {
  const label = `Set ${schema}.${table}`

  return runSql(database, {
    query: {
      postgres: ({ qb, execute, log }) => {
        const query = qb
          .withSchema(schema)
          .withTables<{ [table]: Record<string, unknown> }>()
          .updateTable(table)
          .set(values)
          .where(eb => buildWhere(eb, filters))
          .compile()

        const promise = execute(query)

        log({ ...query, promise, label })

        return promise
      },
      mysql: ({ qb, execute, log }) => {
        const query = qb
          .withSchema(schema)
          .withTables<{ [table]: Record<string, unknown> }>()
          .updateTable(table)
          .set(values)
          .where(eb => buildWhere(eb, filters))
          .compile()

        const promise = execute(query)

        log({ ...query, promise, label })

        return promise
      },
    },
  })
}
