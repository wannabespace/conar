import type { ActiveFilter } from '@tamery/shared/filters'
import { type } from 'arktype'
import { memoize } from 'memoza'

import { createQuery } from '../runtime/query'
import { buildWhere } from './rows'

export const selectQuery = memoize(
  ({
    schema,
    table,
    select,
    filters,
  }: {
    schema: string
    table: string
    select: string[]
    filters: ActiveFilter[]
  }) =>
    createQuery({
      query: {
        clickhouse: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .selectFrom(table)
            .select(select)
            .where((eb) => buildWhere(eb, filters))
            .execute(),
        mssql: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .selectFrom(table)
            .select(select)
            .where((eb) => buildWhere(eb, filters))
            .execute(),
        mysql: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .selectFrom(table)
            .select(select)
            .where((eb) => buildWhere(eb, filters))
            .execute(),
        postgres: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .selectFrom(table)
            .select(select)
            .where((eb) => buildWhere(eb, filters))
            .execute(),
      },
      type: type('Record<string, unknown>[]'),
    })
)
