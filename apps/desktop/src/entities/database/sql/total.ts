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
  return runSql({
    validate: totalType.assert,
    database,
    label: `Total for ${schema}.${table}`,
    query: {
      postgres: db => db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('total'))
        .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
        .$assertType<typeof totalType.inferIn>()
        .compile(),
      mysql: () => {
        throw new Error('Not implemented')
      },
    },
  })
}
