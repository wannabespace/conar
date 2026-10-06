import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { ActiveFilter } from '@tamery/shared/filters'
import { toKyselyFilter } from '@tamery/shared/filters'
import { type } from 'arktype'
import type { Kysely } from 'kysely'

import { createQuery } from '~/core/runtime/query'

import { textContains } from './shape'

const valueCountsType = type({
  count: type('number | string | bigint').pipe(Number),
  value: 'unknown',
}).array()

interface ValueCountsParams {
  column: string
  filters: ActiveFilter[]
  limit: number
  schema: string
  table: string
  term: string
}

const countValues = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  connectionType: ConnectionType,
  { column, filters, limit, schema, table, term }: ValueCountsParams
) =>
  db
    .withSchema(schema)
    .$extendTables<Record<string, Record<string, unknown>>>()
    .selectFrom(table)
    .select((eb) => [eb.ref(column).as('value'), eb.fn.countAll().as('count')])
    .where((eb) => toKyselyFilter(eb, filters))
    .$if(term !== '', (query) =>
      query.where((eb) => textContains[connectionType](eb, column, `%${term}%`))
    )
    .groupBy(column)
    .orderBy('count', 'desc')
    .limit(limit)
    .execute()

/** A column's most frequent values under the table's filters; `term` keeps values whose text contains it, case-insensitively, `%` and `_` acting as wildcards. */
export const valueCountsQuery = (params: ValueCountsParams) =>
  createQuery({
    query: {
      clickhouse: (db) => countValues(db, ConnectionType.ClickHouse, params),
      mssql: (db) => countValues(db, ConnectionType.MSSQL, params),
      mysql: (db) => countValues(db, ConnectionType.MySQL, params),
      postgres: (db) => countValues(db, ConnectionType.Postgres, params),
    },
    type: valueCountsType,
  })
