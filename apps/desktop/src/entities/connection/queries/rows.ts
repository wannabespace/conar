import type { ActiveFilter } from '@conar/shared/filters'
import type { ExpressionBuilder } from 'kysely'
import type { connectionsResources } from '~/drizzle'
import { memoize } from '@conar/shared/utils/helpers'
import { infiniteQueryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'
import { connectionResourceToQueryParams, createQuery } from '../query'
import { DEFAULT_PAGE_LIMIT } from '../utils/helpers'

const rowType = type('Record<string, unknown>')

// eslint-disable-next-line ts/no-explicit-any
export function buildWhere<E extends ExpressionBuilder<any, any>>(eb: E, filters: ActiveFilter[], concatOperator: 'AND' | 'OR' = 'AND') {
  const concat = concatOperator === 'AND' ? eb.and : eb.or

  return concat(
    filters.map(filter => sql.join([
      sql.ref(filter.column),
      sql.raw(filter.ref.operator.toLowerCase()),
      filter.ref.hasValue === false
        ? undefined
        : filter.ref.isArray
          ? sql.join([
              sql.raw('('),
              sql.join(filter.values.map(value => sql.val(String(value).trim()))),
              sql.raw(')'),
            ], sql.raw(''))
          : sql.val(filter.values[0]),
    ].filter(Boolean), sql.raw(' '))),
  )
}

interface PageResult {
  rows: typeof rowType.inferIn[]
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

export function rowsQuery({
  limit = DEFAULT_PAGE_LIMIT,
  select,
  offset,
  table,
  schema,
  query: {
    orderBy,
    filters,
    filtersConcatOperator,
  },
}: RowsQueryProps & { offset: number }) {
  return createQuery({
    type: rowType.array(),
    query: {
      postgres: (db) => {
        const order = Object.entries(orderBy ?? {})

        let query = db
          .withSchema(schema)
          .withTables<{ [table]: Record<string, unknown> }>()
          .selectFrom(table)
          .$if(select !== undefined, qb => qb.select(select!))
          .$if(select === undefined, qb => qb.selectAll())
          .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!, filtersConcatOperator)))
          .limit(limit)
          .offset(offset)

        if (order.length > 0) {
          order.forEach(([column, order]) => {
            query = query.orderBy(column, order.toLowerCase() as Lowercase<typeof order>)
          })
        }

        return query.execute()
      },
      mysql: (db) => {
        const order = Object.entries(orderBy ?? {})

        let query = db
          .withSchema(schema)
          .withTables<{ [table]: Record<string, unknown> }>()
          .selectFrom(table)
          .$if(select !== undefined, qb => qb.select(select!))
          .$if(select === undefined, qb => qb.selectAll())
          .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!, filtersConcatOperator)))
          .limit(limit)
          .offset(offset)

        if (order.length > 0) {
          order.forEach(([column, order]) => {
            query = query.orderBy(column, order.toLowerCase() as Lowercase<typeof order>)
          })
        }

        return query.execute()
      },
      mssql: (db) => {
        const order = Object.entries(orderBy ?? {})

        let query = db
          .withSchema(schema)
          .withTables<{ [table]: Record<string, unknown> }>()
          .selectFrom(table)
          .$if(select !== undefined, qb => qb.select(select!))
          .$if(select === undefined, qb => qb.selectAll())
          .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!, filtersConcatOperator)))
          .$if(order.length === 0, qb => qb.orderBy(sql<string>`(select null)`))
          .limit(limit)
          .offset(offset)

        if (order.length > 0) {
          order.forEach(([column, order]) => {
            query = query.orderBy(column, order.toLowerCase() as Lowercase<typeof order>)
          })
        }

        return query.execute()
      },
      clickhouse: (db) => {
        const order = Object.entries(orderBy ?? {})

        let query = db
          .withSchema(schema)
          .withTables<{ [table]: Record<string, unknown> }>()
          .selectFrom(table)
          .$if(select !== undefined, qb => qb.select(select!))
          .$if(select === undefined, qb => qb.selectAll())
          .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!, filtersConcatOperator)))
          .limit(limit)
          .offset(offset)

        if (order.length > 0) {
          order.forEach(([column, order]) => {
            query = query.orderBy(column, order.toLowerCase() as Lowercase<typeof order>)
          })
        }

        return query.execute()
      },
    },
  })
}

export const resourceRowsQuery = memoize(({
  connectionResource,
  schema,
  table,
  query: { orderBy, filters, filtersConcatOperator },
  ...props
}: {
  connectionResource: typeof connectionsResources.$inferSelect
} & RowsQueryProps) => {
  return infiniteQueryOptions({
    initialPageParam: 0,
    getNextPageParam: (lastPage: PageResult, _allPages: PageResult[], lastPageParam: number) => {
      return lastPage.rows.length === 0 || lastPage.rows.length < DEFAULT_PAGE_LIMIT ? null : lastPageParam + DEFAULT_PAGE_LIMIT
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
        orderBy,
        filters,
        filtersConcatOperator,
      },
    ],
    queryFn: async ({ pageParam: offset }) => {
      const result = await rowsQuery({
        offset,
        table,
        schema,
        query: {
          orderBy,
          filters,
          filtersConcatOperator,
        },
        ...props,
      }).run(connectionResourceToQueryParams(connectionResource))

      return {
        rows: result,
      } satisfies PageResult
    },
    select: data => data.pages.flatMap(page => page.rows),
    throwOnError: false,
  })
})
