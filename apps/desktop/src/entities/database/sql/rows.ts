import type { ActiveFilter } from '@conar/shared/filters'
import type { ExpressionBuilder } from 'kysely'
import { type } from 'arktype'
import { sql } from 'kysely'
import { createQuery } from '../query'

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
    sqlite: (db) => {
      const order = Object.entries(orderBy ?? {})

      let query = db
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
  }),
})
