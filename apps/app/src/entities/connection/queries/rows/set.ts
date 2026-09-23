import type { ActiveFilter } from '@tamery/shared/filters'
import { toKyselyFilter } from '@tamery/shared/filters'
import { memoize } from 'memoza'

import { createQuery } from '../../runtime/query'

export const setQuery = memoize(
  ({
    schema,
    table,
    values,
    filters,
  }: {
    schema: string
    table: string
    values: Record<string, unknown>
    filters: ActiveFilter[]
  }) =>
    createQuery({
      query: {
        clickhouse: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .updateTable(table)
            .set(values)
            .where((eb) => toKyselyFilter(eb, filters))
            .execute(),
        mssql: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .updateTable(table)
            .set(values)
            .where((eb) => toKyselyFilter(eb, filters))
            .execute(),
        mysql: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .updateTable(table)
            .set(values)
            .where((eb) => toKyselyFilter(eb, filters))
            .execute(),
        postgres: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .updateTable(table)
            .set(values)
            .where((eb) => toKyselyFilter(eb, filters))
            .execute(),
      },
    })
)
