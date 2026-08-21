import type { ActiveFilter } from '@tamery/shared/filters'
import { memoize } from 'memoza'

import { createQuery } from '../runtime/query'
import { buildWhere } from './rows'

export const deleteByFiltersQuery = memoize(
  ({
    schema,
    table,
    filters,
    filtersConcatOperator,
  }: {
    schema: string
    table: string
    filters: ActiveFilter[]
    filtersConcatOperator: 'AND' | 'OR'
  }) =>
    createQuery({
      query: {
        clickhouse: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .deleteFrom(table)
            .where((eb) => buildWhere(eb, filters, filtersConcatOperator))
            .execute(),
        mssql: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .deleteFrom(table)
            .where((eb) => buildWhere(eb, filters, filtersConcatOperator))
            .execute(),
        mysql: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .deleteFrom(table)
            .where((eb) => buildWhere(eb, filters, filtersConcatOperator))
            .execute(),
        postgres: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .deleteFrom(table)
            .where((eb) => buildWhere(eb, filters, filtersConcatOperator))
            .execute(),
      },
    })
)
