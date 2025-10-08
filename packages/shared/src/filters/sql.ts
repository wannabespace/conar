import type { Filter, FilterGroup } from '.'

export const SQL_OPERATORS = [
  '=',
  '!=',
  '>',
  '<',
  '>=',
  '<=',
  'LIKE',
  'ILIKE',
  'NOT LIKE',
  'IN',
  'NOT IN',
  'IS NULL',
  'IS NOT NULL',
] as const

export const SQL_FILTERS_GROUPED = [
  {
    group: 'comparison',
    filters: [
      { label: 'Equal', operator: '=', hasValue: true },
      { label: 'Not equal', operator: '!=', hasValue: true },
      { label: 'Greater than', operator: '>', hasValue: true },
      { label: 'Greater than or equal', operator: '>=', hasValue: true },
      { label: 'Less than', operator: '<', hasValue: true },
      { label: 'Less than or equal', operator: '<=', hasValue: true },
    ],
  },
  {

    group: 'text',
    filters: [
      { label: 'Like', operator: 'LIKE', hasValue: true },
      { label: 'Ilike', operator: 'ILIKE', hasValue: true },
      { label: 'Not like', operator: 'NOT LIKE', hasValue: true },
    ],
  },
  {

    group: 'list',
    filters: [
      { label: 'In', operator: 'IN', hasValue: true },
      { label: 'Not in', operator: 'NOT IN', hasValue: true },
    ],
  },
  {
    group: 'null',
    filters: [
      { label: 'Is null', operator: 'IS NULL', hasValue: false },
      { label: 'Is not null', operator: 'IS NOT NULL', hasValue: false },
    ],
  },
] as const satisfies { group: FilterGroup, filters: Filter[] }[]

export const SQL_FILTERS_LIST = SQL_FILTERS_GROUPED.map(group => group.filters).flat()

export interface QueryParams {
  connectionString: string
  sql: string
  params?: unknown[]
  method: 'all' | 'execute'
}
