import type { ExpressionBuilder } from 'kysely'
import { isExpression, sql } from 'kysely'

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

/** How a filter value is matched against `column`; an engine that parses values by column type passes one. */
export type FilterValueBinding = (column: string, value: unknown) => unknown

const filterValueExpression = (
  column: string,
  filter: ActiveFilter,
  bind: FilterValueBinding
) => {
  if (filter.ref.hasValue === false) {
    return null
  }
  const valueOf = (value: unknown) => {
    const bound = bind(column, value)
    return isExpression(bound) ? bound : sql.val(bound)
  }

  if (filter.ref.isArray) {
    return sql.join(
      [
        sql.raw('('),
        sql.join(filter.values.map((value) => valueOf(String(value).trim()))),
        sql.raw(')'),
      ],
      sql.raw('')
    )
  }

  return valueOf(filter.values[0])
}

const unbound: FilterValueBinding = (_, value) => value

// oxlint-disable-next-line ts/no-explicit-any
export const toKyselyFilter = <E extends ExpressionBuilder<any, any>>(
  eb: E,
  filters: ActiveFilter[],
  concatOperator: 'AND' | 'OR' = 'AND',
  bind: FilterValueBinding = unbound
) => {
  const concat = concatOperator === 'AND' ? eb.and : eb.or

  const predicate = (
    column: string,
    filter: ActiveFilter,
    bindValue: FilterValueBinding
  ) =>
    sql.join(
      [
        sql.ref(column),
        sql.raw(SQL_OPERATORS[filter.ref.operator]),
        filterValueExpression(column, filter, bindValue),
      ].filter(Boolean),
      sql.raw(' ')
    )

  return concat(
    filters.map(({ via, ...filter }) =>
      via
        ? sql`${sql.ref(filter.column)} in (select ${sql.ref(via.key)} from ${sql.id(via.schema, via.table)} where ${predicate(via.target, filter, unbound)})`
        : predicate(filter.column, filter, bind)
    )
  )
}
