import type { ActiveFilter } from '@conar/shared/filters'
import { type } from 'arktype'
import { createQuery } from '../query'
import { buildWhere } from './rows'

export const selectQuery = createQuery({
  type: type('Record<string, unknown>[]'),
  query: ({ schema, table, select, filters}: { schema: string, table: string, select: string[], filters: ActiveFilter[] }) => ({
    postgres: ({ db }) => {
      const query = db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(select)
        .where(eb => buildWhere(eb, filters))
        .execute()

      return query
    },
    mysql: ({ db }) => {
      const query = db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(select)
        .where(eb => buildWhere(eb, filters))
        .execute()

      return query
    },
  }),
})
