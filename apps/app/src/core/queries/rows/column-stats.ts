import type { ActiveFilter, FilterValueBinding } from '@tamery/shared/filters'
import { toKyselyFilter } from '@tamery/shared/filters'
import { type } from 'arktype'
import type { Kysely } from 'kysely'

import { createQuery } from '~/core/runtime/query'

import type { ColumnTypes } from './shape'
import { clickhouseFilterValues, sqliteFilterValues } from './shape'

const count = type('number | string | bigint').pipe(Number)

const statsType = type({
  filled: count,
  'max?': 'unknown',
  'min?': 'unknown',
  total: count,
  unique: count,
})

interface ColumnStatsParams {
  column: string
  /** The table's columns, whose types ClickHouse and SQLite bind filter values by. */
  columns: ColumnTypes
  filters: ActiveFilter[]
  ranged: boolean
  schema: string
  table: string
}

const selectStats = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  { column, filters, ranged, schema, table }: ColumnStatsParams,
  bind?: FilterValueBinding
) =>
  db
    .withSchema(schema)
    .$extendTables<Record<string, Record<string, unknown>>>()
    .selectFrom(table)
    .select((eb) => [
      eb.fn.countAll().as('total'),
      eb.fn.count(column).as('filled'),
      eb.fn.count(column).distinct().as('unique'),
    ])
    .$if(ranged, (query) =>
      query.select((eb) => [
        eb.fn.min(column).as('min'),
        eb.fn.max(column).as('max'),
      ])
    )
    .where((eb) => toKyselyFilter(eb, filters, 'AND', bind))
    .executeTakeFirstOrThrow()

// Pass `ranged` only for ordered types: it adds min and max.
export const columnStatsQuery = (params: ColumnStatsParams) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        selectStats(db, params, clickhouseFilterValues(params.columns)),
      duckdb: (db) => selectStats(db, params),
      mssql: (db) => selectStats(db, params),
      mysql: (db) => selectStats(db, params),
      postgres: (db) => selectStats(db, params),
      sqlite: (db) =>
        selectStats(db, params, sqliteFilterValues(params.columns)),
    },
    type: statsType,
  })
