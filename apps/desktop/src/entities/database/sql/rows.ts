import type { ActiveFilter } from '@conar/shared/utils/filters'
import type { databases } from '~/drizzle'
import { sql } from 'drizzle-orm'
import { runSql } from '../query'

export function buildWhere(filters: ActiveFilter[], concatOperator: 'AND' | 'OR' = 'AND') {
  return sql.join(
    filters.map((filter) => {
      if (filter.ref.hasValue && filter.values.length > 0) {
        if (filter.values.length === 1) {
          return sql`${sql.identifier(filter.column)} ${sql.raw(filter.ref.operator)} ${sql.param(filter.values[0])}`
        }

        return sql`${sql.identifier(filter.column)} ${sql.raw(filter.ref.operator)} (${sql.join(filter.values.map(v => sql.param(v)), sql.raw(', '))})`
      }

      return sql.join(
        [
          sql.identifier(filter.column),
          sql.raw(filter.ref.operator),
        ],
        sql.raw(' '),
      )
    }),
    sql.raw(` ${concatOperator} `),
  )
}

export function rowsSql(database: typeof databases.$inferSelect, params: {
  schema: string
  table: string
  limit: number
  offset: number
  orderBy?: Record<string, 'ASC' | 'DESC'>
  filters?: ActiveFilter[]
  filtersConcatOperator?: 'AND' | 'OR'
  select?: string[]
}) {
  const orderBy = Object.entries(params.orderBy ?? {})

  return runSql({
    database,
    label: `Rows for ${params.schema}.${params.table}`,
    query: ({ db }) => db.execute(
      sql.join(
        [
          params.select ? sql`SELECT ${params.select.map(column => sql.identifier(column)).join(', ')}` : sql`SELECT *`,
          sql`FROM ${sql.identifier(params.schema)}.${sql.identifier(params.table)}`,
          params.filters?.length ? sql`WHERE ${buildWhere(params.filters, params.filtersConcatOperator)}` : undefined,
          orderBy.length > 0
            ? sql`ORDER BY ${orderBy
              .map(([column, order]) => sql`${sql.identifier(column)} ${order}`)
              .join(', ')}`
            : undefined,
          sql`LIMIT ${params.limit}`,
          sql`OFFSET ${params.offset}`,
        ],
        sql.raw(' '),
      ),
    ),
  })
}
