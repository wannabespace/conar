import type { FilterOperator } from './types'

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
