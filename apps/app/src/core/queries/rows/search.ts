import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import type { Kysely } from 'kysely'

import type { ConnectionResource } from '~/core/connection/sync'
import {
  connectionResourceToQueryParams,
  createQuery,
} from '~/core/runtime/query'

import { resourceRowsQueryKey } from './list'
import type { ContainsText } from './shape'
import { textContains } from './shape'

const rowsType = type('Record<string, unknown>[]')

interface SearchRowsParams {
  columns: string[]
  limit: number
  schema: string
  table: string
  term: string
}

const searchRows = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  contains: ContainsText,
  { columns, limit, schema, table, term }: SearchRowsParams
) =>
  db
    .withSchema(schema)
    .$extendTables<Record<string, Record<string, unknown>>>()
    .selectFrom(table)
    .selectAll()
    .$if(term !== '', (query) =>
      query.where((eb) =>
        eb.or(columns.map((column) => contains(eb, column, `%${term}%`)))
      )
    )
    .limit(limit)
    .execute()

/** `term` matches anywhere in any of `columns` cast to text, case-insensitively; `%` and `_` in it act as wildcards. */
export const searchRowsQuery = (params: SearchRowsParams) =>
  createQuery({
    query: {
      clickhouse: (db) => searchRows(db, textContains.clickhouse, params),
      mssql: (db) => searchRows(db, textContains.mssql, params),
      mysql: (db) => searchRows(db, textContains.mysql, params),
      postgres: (db) => searchRows(db, textContains.postgres, params),
    },
    type: rowsType,
  })

export const searchRowsQueryOptions = ({
  connectionResource,
  ...params
}: SearchRowsParams & { connectionResource: ConnectionResource }) =>
  queryOptions({
    queryFn: async () =>
      searchRowsQuery(params).run(
        await connectionResourceToQueryParams(connectionResource)
      ),
    queryKey: [
      ...resourceRowsQueryKey({ connectionResource, ...params }),
      'search',
      params.columns,
      params.term,
      params.limit,
    ],
  })
