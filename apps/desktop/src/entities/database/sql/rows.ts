import type { ActiveFilter } from '@conar/shared/filters'
import type { BINARY_OPERATORS, ExpressionBuilder } from 'kysely'
import { type } from 'arktype'
import { createQuery } from '../query'

// eslint-disable-next-line ts/no-explicit-any
export function buildWhere<E extends ExpressionBuilder<any, any>>(eb: E, filters: ActiveFilter[], concatOperator: 'AND' | 'OR' = 'AND') {
  const concat = concatOperator === 'AND' ? eb.and : eb.or

  return concat(
    filters.map(filter => eb(
      filter.column,
      filter.ref.operator.toLowerCase() as typeof BINARY_OPERATORS[number],
      filter.ref.constValue !== undefined
        ? filter.ref.constValue
        : filter.values.length === 1
          ? filter.values[0]
          : filter.values,
    )),
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
