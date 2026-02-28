import type { ActiveFilter } from '@conar/shared/filters'
import type { ExpressionBuilder, Kysely } from 'kysely'
import type { Database as PostgresDatabase } from '../dialects/postgres/schema'
import { type } from 'arktype'
import { sql } from 'kysely'
import { createQuery } from '../query'

function toOrderDirection(order: 'ASC' | 'DESC'): 'asc' | 'desc' {
  return order === 'ASC' ? 'asc' : 'desc'
}

interface RowsQueryParams {
  schema: string
  table: string
  limit: number
  offset: number
  orderBy?: Record<string, 'ASC' | 'DESC'>
  filters?: ActiveFilter[]
  filtersConcatOperator?: 'AND' | 'OR'
  select?: string[]
}

function createPostgresRowsQuery(params: RowsQueryParams) {
  return (db: Kysely<PostgresDatabase>) => {
    const order = Object.entries(params.orderBy ?? {})

    let query = db
      .withSchema(params.schema)
      .withTables<{ [key: string]: Record<string, unknown> }>()
      .selectFrom(params.table)
      .$if(params.select !== undefined, qb => qb.select(params.select!))
      .$if(params.select === undefined, qb => qb.selectAll())
      .$if(params.filters !== undefined, qb => qb.where(eb => buildWhere(eb, params.filters!, params.filtersConcatOperator)))
      .limit(params.limit)
      .offset(params.offset)

    for (const [column, orderDir] of order) {
      query = query.orderBy(column, toOrderDirection(orderDir))
    }

    return query.execute()
  }
}

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

export const rowsQuery = createQuery({
  type: type('Record<string, unknown>[]'),
  query: ({
    schema,
    table,
    limit,
    offset,
    orderBy,
    filters,
    filtersConcatOperator,
    select,
  }: {
    schema: string
    table: string
    limit: number
    offset: number
    orderBy?: Record<string, 'ASC' | 'DESC'>
    filters?: ActiveFilter[]
    filtersConcatOperator?: 'AND' | 'OR'
    select?: string[]
  }) => ({
    postgres: createPostgresRowsQuery({
      schema,
      table,
      limit,
      offset,
      orderBy,
      filters,
      filtersConcatOperator,
      select,
    }),
    supabase: createPostgresRowsQuery({
      schema,
      table,
      limit,
      offset,
      orderBy,
      filters,
      filtersConcatOperator,
      select,
    }),
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
          query = query.orderBy(column, toOrderDirection(order))
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
          query = query.orderBy(column, toOrderDirection(order))
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
          query = query.orderBy(column, toOrderDirection(order))
        })
      }

      return query.execute()
    },
  }),
})
