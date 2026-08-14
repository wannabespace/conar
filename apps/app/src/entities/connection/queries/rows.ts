import type { ActiveFilter } from '@tamery/shared/filters'
import { infiniteQueryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import type { ExpressionBuilder } from 'kysely'
import { sql } from 'kysely'
import { memoize } from 'memoza'

import type { ConnectionResource } from '~/entities/connection/core'

import { connectionResourceToQueryParams, createQuery } from '../runtime/query'
import { DEFAULT_PAGE_LIMIT } from '../utils/helpers'

const rowType = type('Record<string, unknown>')

const filterValueExpression = (filter: ActiveFilter) => {
  if (filter.ref.hasValue === false) {
    return null
  }

  if (filter.ref.isArray) {
    return sql.join(
      [
        sql.raw('('),
        sql.join(filter.values.map((value) => sql.val(String(value).trim()))),
        sql.raw(')'),
      ],
      sql.raw('')
    )
  }

  return sql.val(filter.values[0])
}

// oxlint-disable-next-line ts/no-explicit-any
export const buildWhere = <E extends ExpressionBuilder<any, any>>(
  eb: E,
  filters: ActiveFilter[],
  concatOperator: 'AND' | 'OR' = 'AND'
) => {
  const concat = concatOperator === 'AND' ? eb.and : eb.or

  return concat(
    filters.map((filter) =>
      sql.join(
        [
          sql.ref(filter.column),
          sql.raw(filter.ref.operator.toLowerCase()),
          filterValueExpression(filter),
        ].filter(Boolean),
        sql.raw(' ')
      )
    )
  )
}

interface PageResult {
  rows: (typeof rowType.inferIn)[]
}

export interface RowsQueryProps {
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

export const resourceRowsQuery = memoize(
  ({
    limit = DEFAULT_PAGE_LIMIT,
    select,
    offset,
    table,
    schema,
    query: { orderBy, filters, filtersConcatOperator },
  }: RowsQueryProps & { offset: number }) =>
    createQuery({
      query: {
        clickhouse: (db) => {
          const orders = orderEntries(orderBy)
          const selectedColumns = select
          const activeFilters = filters

          let query = db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .selectFrom(table)

          query =
            selectedColumns === undefined
              ? query.selectAll()
              : query.select(selectedColumns)

          if (activeFilters !== undefined) {
            query = query.where((eb) =>
              buildWhere(eb, activeFilters, filtersConcatOperator)
            )
          }

          query = query.limit(limit).offset(offset)

          for (const [column, direction] of orders) {
            query = query.orderBy(
              column,
              direction.toLowerCase() as Lowercase<typeof direction>
            )
          }

          return query.execute()
        },
        mssql: (db) => {
          const orders = orderEntries(orderBy)
          const selectedColumns = select
          const activeFilters = filters

          let query = db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .selectFrom(table)

          query =
            selectedColumns === undefined
              ? query.selectAll()
              : query.select(selectedColumns)

          if (activeFilters !== undefined) {
            query = query.where((eb) =>
              buildWhere(eb, activeFilters, filtersConcatOperator)
            )
          }

          if (orders.length === 0) {
            query = query.orderBy(sql<string>`(select null)`)
          }

          query = query.limit(limit).offset(offset)

          for (const [column, direction] of orders) {
            query = query.orderBy(
              column,
              direction.toLowerCase() as Lowercase<typeof direction>
            )
          }

          return query.execute()
        },
        mysql: (db) => {
          const orders = orderEntries(orderBy)
          const selectedColumns = select
          const activeFilters = filters

          let query = db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .selectFrom(table)

          query =
            selectedColumns === undefined
              ? query.selectAll()
              : query.select(selectedColumns)

          if (activeFilters !== undefined) {
            query = query.where((eb) =>
              buildWhere(eb, activeFilters, filtersConcatOperator)
            )
          }

          query = query.limit(limit).offset(offset)

          for (const [column, direction] of orders) {
            query = query.orderBy(
              column,
              direction.toLowerCase() as Lowercase<typeof direction>
            )
          }

          return query.execute()
        },
        postgres: (db) => {
          const orders = orderEntries(orderBy)
          const selectedColumns = select
          const activeFilters = filters

          let query = db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .selectFrom(table)

          query =
            selectedColumns === undefined
              ? query.selectAll()
              : query.select(selectedColumns)

          if (activeFilters !== undefined) {
            query = query.where((eb) =>
              buildWhere(eb, activeFilters, filtersConcatOperator)
            )
          }

          query = query.limit(limit).offset(offset)

          for (const [column, direction] of orders) {
            query = query.orderBy(
              column,
              direction.toLowerCase() as Lowercase<typeof direction>
            )
          }

          return query.execute()
        },
      },
      type: rowType.array(),
    })
)

export const resourceRowsQueryInfiniteOptions = memoize(
  ({
    connectionResource,
    schema,
    table,
    query: { orderBy, filters, filtersConcatOperator },
    ...props
  }: {
    connectionResource: ConnectionResource
  } & RowsQueryProps) =>
    infiniteQueryOptions({
      getNextPageParam: (
        lastPage: PageResult,
        _allPages: PageResult[],
        lastPageParam: number
      ) =>
        lastPage.rows.length === 0 || lastPage.rows.length < DEFAULT_PAGE_LIMIT
          ? null
          : lastPageParam + DEFAULT_PAGE_LIMIT,
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
        'connection-resource',
        connectionResource.id,
        'schema',
        schema,
        'table',
        table,
        'rows',
        {
          filters,
          filtersConcatOperator,
          orderBy,
        },
      ],
      select: (data) => data.pages.flatMap((page) => page.rows),
      throwOnError: false,
    })
)
