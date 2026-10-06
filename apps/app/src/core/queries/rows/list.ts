import type { ActiveFilter, FilterValueBinding } from '@tamery/shared/filters'
import { EQUAL_FILTER, toKyselyFilter } from '@tamery/shared/filters'
import { infiniteQueryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import type { Kysely } from 'kysely'
import { memoize } from 'memoza'

import type { ConnectionResource } from '~/core/connection/sync'
import { DEFAULT_PAGE_LIMIT } from '~/core/connection/utils'
import {
  connectionResourceToQueryParams,
  createQuery,
} from '~/core/runtime/query'

import type { ColumnTypes } from './shape'
import { clickhouseFilterValues } from './shape'

const rowType = type('Record<string, unknown>')

interface PageResult {
  rows: (typeof rowType.inferIn)[]
}

export interface RowsQueryProps {
  /** The table's columns, whose types ClickHouse parses filter values by. */
  columns?: ColumnTypes
  limit?: number
  select?: string[]
  table: string
  schema: string
  query: {
    filtersConcatOperator?: 'AND' | 'OR'
    orderBy?: Record<string, 'ASC' | 'DESC'>
    filters?: ActiveFilter[]
  }
}

const orderEntries = (orderBy: Record<string, 'ASC' | 'DESC'> | undefined) =>
  Object.entries(orderBy ?? {}) as [string, 'ASC' | 'DESC'][]

const selectPage = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  {
    limit = DEFAULT_PAGE_LIMIT,
    select,
    offset,
    table,
    schema,
    query: { orderBy, filters, filtersConcatOperator },
  }: RowsQueryProps & { offset: number },
  bind?: FilterValueBinding
) => {
  let query = db
    .withSchema(schema)
    .$extendTables<{ [table]: Record<string, unknown> }>()
    .selectFrom(table)

  query = select === undefined ? query.selectAll() : query.select(select)

  if (filters !== undefined) {
    query = query.where((eb) =>
      toKyselyFilter(eb, filters, filtersConcatOperator, bind)
    )
  }

  for (const [column, direction] of orderEntries(orderBy)) {
    query = query.orderBy(
      column,
      direction.toLowerCase() as Lowercase<typeof direction>
    )
  }

  return query.limit(limit).offset(offset).execute()
}

export const resourceRowsQuery = memoize(
  (props: RowsQueryProps & { offset: number }) =>
    createQuery({
      query: {
        clickhouse: (db) =>
          selectPage(db, props, clickhouseFilterValues(props.columns)),
        mssql: (db) => selectPage(db, props),
        mysql: (db) => selectPage(db, props),
        postgres: (db) => selectPage(db, props),
      },
      type: rowType.array(),
    })
)

export const resourceRowsQueryKey = ({
  connectionResource,
  schema,
  table,
}: {
  connectionResource: ConnectionResource
  schema: string
  table: string
}) => [
  'connection-resource',
  connectionResource.id,
  'schema',
  schema,
  'table',
  table,
  'rows',
]

export const resourceRowsQueryInfiniteOptions = memoize(
  ({
    connectionResource,
    schema,
    table,
    query: { orderBy, filters, filtersConcatOperator },
    ...props
  }: {
    connectionResource: ConnectionResource
  } & RowsQueryProps) => {
    const pageLimit = props.limit ?? DEFAULT_PAGE_LIMIT

    return infiniteQueryOptions({
      getNextPageParam: (
        lastPage: PageResult,
        _allPages: PageResult[],
        lastPageParam: number
      ) =>
        lastPage.rows.length === 0 || lastPage.rows.length < pageLimit
          ? null
          : lastPageParam + pageLimit,
      initialPageParam: 0,
      queryFn: async ({ pageParam: offset }) => {
        const result = await resourceRowsQuery({
          offset,
          query: {
            filters,
            filtersConcatOperator,
            orderBy,
          },
          schema,
          table,
          ...props,
        }).run(await connectionResourceToQueryParams(connectionResource))

        return {
          rows: result,
        } satisfies PageResult
      },
      queryKey: [
        ...resourceRowsQueryKey({ connectionResource, schema, table }),
        {
          filters,
          filtersConcatOperator,
          orderBy,
        },
      ],
      select: (data) => data.pages.flatMap((page) => page.rows),
      throwOnError: false,
    })
  }
)

/** Rows of `table` whose `column` holds `value`: the reference peek and the reference picker share this cache entry. */
export const matchingRowsQueryOptions = ({
  column,
  connectionResource,
  schema,
  table,
  value,
}: {
  column: string
  connectionResource: ConnectionResource
  schema: string
  table: string
  value: unknown
}) =>
  resourceRowsQueryInfiniteOptions({
    connectionResource,
    query: {
      filters: [{ column, ref: EQUAL_FILTER, values: [value] }],
      orderBy: {},
    },
    schema,
    table,
  })
