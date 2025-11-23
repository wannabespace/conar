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
    postgres: ({ db }) => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .updateTable(table)
      .set(values)
      .where(eb => buildWhere(eb, filters))
      .execute(),
    mysql: ({ db }) => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .updateTable(table)
      .set(values)
      .where(eb => buildWhere(eb, filters))
      .execute(),
  }),
})
