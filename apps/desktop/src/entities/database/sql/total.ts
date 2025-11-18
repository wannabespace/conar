import type { ActiveFilter } from '@conar/shared/filters'
import { type } from 'arktype'
import { createQuery } from '../query'
import { buildWhere } from './rows'

export const totalQuery = createQuery({
  type: type('string | number | bigint | undefined').pipe(v => v !== undefined ? Number(v) : undefined),
  query: ({
    schema,
    table,
    filters,
  }: { schema: string, table: string, filters?: ActiveFilter[] }) => ({
    postgres: async ({ db }) => {
      const query = await db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('total'))
        .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
        .execute()

      return query[0]?.total
    },
    mysql: async ({ db }) => {
      const query = await db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('total'))
        .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
        .execute()

      return query[0]?.total
    },
  }),
})
