import type { Filter, FilterGroup } from './types'

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
      { label: 'In', operator: 'IN', isArray: true },
      { label: 'Not in', operator: 'NOT IN', isArray: true },
    ],
  },
  {
    group: 'null',
    filters: [
      { label: 'Is null', operator: 'IS NULL', hasValue: false },
      { label: 'Is not null', operator: 'IS NOT NULL', hasValue: false },
    ],
  },
] as const satisfies {
  group: FilterGroup
  filters: Filter[]
}[]

export const SQL_FILTERS_LIST = SQL_FILTERS_GROUPED.map(group => group.filters).flat()

export interface QueryParams {
  connectionString: string
  sql: string
  params?: unknown[]
  method: 'all' | 'execute'
}
