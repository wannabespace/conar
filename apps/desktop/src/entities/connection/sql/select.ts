import type { ActiveFilter } from '@conar/shared/filters'
import { type } from 'arktype'
import { createQuery } from '../query'
import { buildWhere } from './rows'

export const selectQuery = createQuery({
  type: type('Record<string, unknown>[]'),
  query: ({ schema, table, select, filters }: {
    schema: string
    table: string
    select: string[]
    filters: ActiveFilter[]
  }) => {
    const pgLike = (db: Parameters<ReturnType<Parameters<typeof createQuery>[0]['query']>['postgres']>[0]) => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .selectFrom(table)
      .select(select)
      .where(eb => buildWhere(eb, filters))
      .execute()
    return {
      postgres: pgLike,
      supabase: pgLike,
      mysql: db => db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(select)
        .where(eb => buildWhere(eb, filters))
        .execute(),
      mssql: db => db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(select)
        .where(eb => buildWhere(eb, filters))
        .execute(),
      clickhouse: db => db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(select)
        .where(eb => buildWhere(eb, filters))
        .execute(),
    }
  },
})
