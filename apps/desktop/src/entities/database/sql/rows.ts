import type { ActiveFilter } from '@conar/shared/filters'
import type { BINARY_OPERATORS, ExpressionBuilder } from 'kysely'
import type { databases } from '~/drizzle'
import { runSql } from '../query'

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

export function rowsSql(database: typeof databases.$inferSelect, {
  schema,
  table,
  limit,
  offset,
  filters,
  filtersConcatOperator,
  select,
  ...params
}: {
  schema: string
  table: string
  limit: number
  offset: number
  orderBy?: Record<string, 'ASC' | 'DESC'>
  filters?: ActiveFilter[]
  filtersConcatOperator?: 'AND' | 'OR'
  select?: string[]
}) {
  const label = `Rows for ${schema}.${table}`
  const orderBy = Object.entries(params.orderBy ?? {})

  return runSql(database, {
    query: {
      postgres: ({ qb, execute, log }) => {
        let query = qb
          .withSchema(schema)
          .withTables<{ [table]: Record<string, unknown> }>()
          .selectFrom(table)
          .$if(select !== undefined, qb => qb.select(select!))
          .$if(select === undefined, qb => qb.selectAll())
          .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!, filtersConcatOperator)))
          .limit(limit)
          .offset(offset)

        if (orderBy.length > 0) {
          orderBy.forEach(([column, order]) => {
            query = query.orderBy(column, order.toLowerCase() as Lowercase<typeof order>)
          })
        }

        const compiledQuery = query.compile()

        const promise = execute(compiledQuery)

        log({ ...compiledQuery, promise, label })

        return promise
      },
      mysql: ({ qb, execute, log }) => {
        let query = qb
          .withSchema(schema)
          .withTables<{ [table]: Record<string, unknown> }>()
          .selectFrom(table)
          .$if(select !== undefined, qb => qb.select(select!))
          .$if(select === undefined, qb => qb.selectAll())
          .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!, filtersConcatOperator)))
          .limit(limit)
          .offset(offset)

        if (orderBy.length > 0) {
          orderBy.forEach(([column, order]) => {
            query = query.orderBy(column, order.toLowerCase() as Lowercase<typeof order>)
          })
        }

        const compiledQuery = query.compile()

        const promise = execute(compiledQuery)

        log({ ...compiledQuery, promise, label })

        return promise
      },
    },
  })
}
