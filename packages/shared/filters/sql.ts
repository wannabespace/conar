import type { Filter, FilterGroup } from './types'

export const SQL_FILTERS_GROUPED = [
  {
    filters: [
      { label: 'Equal', operator: '=' },
      { label: 'Not equal', operator: '!=' },
      { label: 'Greater than', operator: '>' },
      { label: 'Greater than or equal', operator: '>=' },
      { label: 'Less than', operator: '<' },
      { label: 'Less than or equal', operator: '<=' },
    ],
    group: 'comparison',
  },
  {
    filters: [
      { label: 'Like', operator: 'LIKE' },
      { label: 'Ilike', operator: 'ILIKE' },
      { label: 'Not like', operator: 'NOT LIKE' },
    ],
    group: 'text',
  },
  {
    filters: [
      { isArray: true, label: 'In', operator: 'IN' },
      { isArray: true, label: 'Not in', operator: 'NOT IN' },
    ],
    group: 'list',
  },
  {
    filters: [
      { hasValue: false, label: 'Is null', operator: 'IS NULL' },
      { hasValue: false, label: 'Is not null', operator: 'IS NOT NULL' },
    ],
    group: 'null',
  },
] as const satisfies {
  group: FilterGroup
  filters: Filter[]
}[]

// oxlint-disable-next-line unicorn/prefer-array-flat-map -- flatMap widens the `as const` tuple union and breaks Filter typing
export const SQL_FILTERS_LIST = SQL_FILTERS_GROUPED.map(
  (group) => group.filters
).flat()

export interface QueryParams {
  connectionString: string
  sql: string
  params?: unknown[]
  method: 'all' | 'execute'
}
