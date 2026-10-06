import type { ActiveFilter, FilterValueBinding } from '@tamery/shared/filters'
import { toKyselyFilter } from '@tamery/shared/filters'
import { type } from 'arktype'
import type { Kysely } from 'kysely'

import { createQuery } from '~/core/runtime/query'

import type { ColumnTypes, ContainsText } from './shape'
import { clickhouseFilterValues, textContains } from './shape'

const valueCountsType = type({
  count: type('number | string | bigint').pipe(Number),
  value: 'unknown',
}).array()

interface ValueCountsParams {
  column: string
  /** The table's columns, whose types ClickHouse parses filter values by. */
  columns: ColumnTypes
  filters: ActiveFilter[]
  limit: number
  schema: string
  table: string
  term: string
}

const countValues = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  contains: ContainsText,
  { column, filters, limit, schema, table, term }: ValueCountsParams,
  bind?: FilterValueBinding
) =>
  db
    .withSchema(schema)
    .$extendTables<Record<string, Record<string, unknown>>>()
    .selectFrom(table)
    .select((eb) => [eb.ref(column).as('value'), eb.fn.countAll().as('count')])
    .where((eb) => toKyselyFilter(eb, filters, 'AND', bind))
    .$if(term !== '', (query) =>
      query.where((eb) => contains(eb, column, `%${term}%`))
    )
    .groupBy(column)
    .orderBy('count', 'desc')
    .limit(limit)
    .execute()

/** A column's most frequent values under the table's filters; `term` keeps values whose text contains it, case-insensitively, `%` and `_` acting as wildcards. */
export const valueCountsQuery = (params: ValueCountsParams) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        countValues(
          db,
          textContains.clickhouse,
          params,
          clickhouseFilterValues(params.columns)
        ),
      mssql: (db) => countValues(db, textContains.mssql, params),
      mysql: (db) => countValues(db, textContains.mysql, params),
      postgres: (db) => countValues(db, textContains.postgres, params),
    },
    type: valueCountsType,
  })
