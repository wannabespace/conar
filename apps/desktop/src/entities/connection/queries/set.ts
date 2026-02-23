import type { ActiveFilter } from '@conar/shared/filters'
import { memoize } from '@conar/shared/utils/helpers'
import { createQuery } from '../query'
import { buildWhere } from './rows'

export const setQuery = memoize(({
  schema,
  table,
  values,
  filters,
}: {
  schema: string
  table: string
  values: Record<string, unknown>
  filters: ActiveFilter[]
}) => createQuery({
  query: {
    postgres: db => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .updateTable(table)
      .set(values)
      .where(eb => buildWhere(eb, filters))
      .execute(),
    mysql: db => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .updateTable(table)
      .set(values)
      .where(eb => buildWhere(eb, filters))
      .execute(),
    mssql: db => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .updateTable(table)
      .set(values)
      .where(eb => buildWhere(eb, filters))
      .execute(),
    clickhouse: db => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .updateTable(table)
      .set(values)
      .where(eb => buildWhere(eb, filters))
      .execute(),
  },
}))
