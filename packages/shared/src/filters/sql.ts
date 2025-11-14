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
      { label: 'Equal', operator: '=' },
      { label: 'Not equal', operator: '!=' },
      { label: 'Greater than', operator: '>' },
      { label: 'Greater than or equal', operator: '>=' },
      { label: 'Less than', operator: '<' },
      { label: 'Less than or equal', operator: '<=' },
    ],
  },
  {

    group: 'text',
    filters: [
      { label: 'Like', operator: 'LIKE' },
      { label: 'Ilike', operator: 'ILIKE' },
      { label: 'Not like', operator: 'NOT LIKE' },
    ],
  },
  {

    group: 'list',
    filters: [
      { label: 'In', operator: 'IN' },
      { label: 'Not in', operator: 'NOT IN' },
    ],
  },
  {
    group: 'null',
    filters: [
      { label: 'Is null', operator: 'IS', constValue: null },
      { label: 'Is not null', operator: 'IS NOT', constValue: null },
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
