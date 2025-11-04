import type { ActiveFilter } from '@conar/shared/filters'
import type { databases } from '~/drizzle'
import { and, or, sql } from 'drizzle-orm'
import { runSql } from '../query'

const concatOperatorsMap = {
  AND: and,
  OR: or,
}

export function buildWhere(filters: ActiveFilter[], concatOperator: keyof typeof concatOperatorsMap = 'AND') {
  const concat = concatOperatorsMap[concatOperator]

  return concat(
    ...filters.map((filter) => {
      if (filter.ref.hasValue && filter.values.length > 0) {
        if (filter.values.length === 1) {
          return sql.join(
            [
              sql.identifier(filter.column),
              sql.raw(filter.ref.operator),
              sql.param(filter.values[0]),
            ],
            sql.raw(' '),
          )
        }

        return sql.join(
          [
            sql.identifier(filter.column),
            sql.raw(filter.ref.operator),
            sql`(${sql.join(filter.values.map(v => sql.param(v)), sql.raw(', '))})`,
          ],
          sql.raw(' '),
        )
      }

      return sql.join(
        [
          sql.identifier(filter.column),
          sql.raw(filter.ref.operator),
        ],
        sql.raw(' '),
      )
    }),
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
          params.select
            ? sql`SELECT ${sql.join(params.select.map(column => sql.identifier(column)), sql.raw(', '))}`
            : sql`SELECT *`,
          sql`FROM ${sql.identifier(params.schema)}.${sql.identifier(params.table)}`,
          params.filters?.length ? sql`WHERE ${buildWhere(params.filters, params.filtersConcatOperator)}` : undefined,
          orderBy.length > 0
            ? sql`ORDER BY ${sql.join(
              orderBy.map(([column, order]) => sql`${sql.identifier(column)} ${sql.raw(order)}`),
              sql.raw(', '),
            )}`
            : undefined,
          sql`LIMIT ${params.limit}`,
          sql`OFFSET ${params.offset}`,
        ],
        sql.raw(' '),
      ),
    ),
  })
}
