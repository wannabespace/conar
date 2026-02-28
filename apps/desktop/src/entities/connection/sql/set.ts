import type { ActiveFilter } from '@conar/shared/filters'
import { createQuery } from '../query'
import { buildWhere } from './rows'

export const setQuery = createQuery({
  query: ({
    schema,
    table,
    values,
    filters,
  }: {
    schema: string
    table: string
    values: Record<string, unknown>
    filters: ActiveFilter[]
  }) => {
    const pgLike = (db: Parameters<ReturnType<Parameters<typeof createQuery>[0]['query']>['postgres']>[0]) => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .updateTable(table)
      .set(values)
      .where(eb => buildWhere(eb, filters))
      .execute()
    return {
      postgres: pgLike,
      supabase: pgLike,
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
    }
  },
})
