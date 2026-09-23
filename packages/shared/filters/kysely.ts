import type { ExpressionBuilder } from 'kysely'
import { sql } from 'kysely'

import type { ActiveFilter, FilterOperator } from './types'

export const SQL_OPERATORS: Record<FilterOperator, string> = {
  eq: '=',
  gt: '>',
  gte: '>=',
  ilike: 'ilike',
  in: 'in',
  isNotNull: 'is not null',
  isNull: 'is null',
  like: 'like',
  lt: '<',
  lte: '<=',
  ne: '!=',
  notIn: 'not in',
  notLike: 'not like',
}

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
export const toKyselyFilter = <E extends ExpressionBuilder<any, any>>(
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
          sql.raw(SQL_OPERATORS[filter.ref.operator]),
          filterValueExpression(filter),
        ].filter(Boolean),
        sql.raw(' ')
      )
    )
  )
}
