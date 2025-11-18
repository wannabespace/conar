import type { ActiveFilter } from '@conar/shared/filters'
import { createQuery } from '../query'
import { buildWhere } from './rows'

export const setQuery = createQuery({
  query: ({
    schema,
    table,
    values,
    filters,
  }: { schema: string, table: string, values: Record<string, unknown>, filters: ActiveFilter[] }) => ({
    postgres: ({ db }) => {
      const query = db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .updateTable(table)
        .set(values)
        .where(eb => buildWhere(eb, filters))
        .execute()

      return query
    },
    mysql: ({ db }) => {
      const query = db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .updateTable(table)
        .set(values)
        .where(eb => buildWhere(eb, filters))
        .execute()

      return query
    },
  }),
})
