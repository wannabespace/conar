import type { ActiveFilter } from '@conar/shared/filters'
import type { databases } from '~/drizzle'
import { type } from 'arktype'
import { runSql } from '../query'
import { buildWhere } from './rows'

export const totalType = type({
  total: 'string | number | bigint',
}).pipe(({ total }) => ({
  total: Number(total),
}))

export function totalSql(database: typeof databases.$inferSelect, {
  schema,
  table,
  filters,
}: { schema: string, table: string, filters?: ActiveFilter[] }) {
  const label = `Total for ${schema}.${table}`

  return runSql(database, {
    validate: totalType.assert,
    query: {
      postgres: ({ qb, execute, log }) => {
        const query = qb
          .withSchema(schema)
          .withTables<{ [table]: Record<string, unknown> }>()
          .selectFrom(table)
          .select(qb.fn.countAll().as('total'))
          .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
          .$assertType<typeof totalType.inferIn>()
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
          .select(qb.fn.countAll().as('total'))
          .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
          .$assertType<typeof totalType.inferIn>()
          .compile()

        const promise = execute(query)

        log({ ...query, promise, label })

        return promise
      },
    },
  })
}
