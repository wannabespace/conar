import type { ActiveFilter } from '@conar/shared/filters'
import type { databases } from '~/drizzle'
import { runSql } from '../query'
import { buildWhere } from './rows'

export function selectSql(database: typeof databases.$inferSelect, {
  schema,
  table,
  select,
  filters,
}: { schema: string, table: string, select: string[], filters: ActiveFilter[] }) {
  const label = `Select ${schema}.${table}`

  return runSql(database, {
    query: {
      postgres: ({ qb, execute, log }) => {
        const query = qb
          .withSchema(schema)
          .withTables<{ [table]: Record<string, unknown> }>()
          .selectFrom(table)
          .select(select)
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
          .selectFrom(table)
          .select(select)
          .where(eb => buildWhere(eb, filters))
          .compile()

        const promise = execute(query)

        log({ ...query, promise, label })

        return promise
      },
    },
  })
}
