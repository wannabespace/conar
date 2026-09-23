import type { Filter, FilterGroup } from './types'

export const EQUAL_FILTER = {
  label: 'Equal',
  operator: 'eq',
  symbol: '=',
} as const satisfies Filter

export const FILTERS_GROUPED = [
  {
    filters: [
      EQUAL_FILTER,
      { label: 'Not equal', operator: 'ne', symbol: '!=' },
      { label: 'Greater than', operator: 'gt', symbol: '>' },
      { label: 'Greater than or equal', operator: 'gte', symbol: '>=' },
      { label: 'Less than', operator: 'lt', symbol: '<' },
      { label: 'Less than or equal', operator: 'lte', symbol: '<=' },
    ],
    group: 'comparison',
  },
  {
    filters: [
      { label: 'Like', operator: 'like', symbol: 'LIKE' },
      { label: 'Ilike', operator: 'ilike', symbol: 'ILIKE' },
      { label: 'Not like', operator: 'notLike', symbol: 'NOT LIKE' },
    ],
    group: 'text',
  },
  {
    filters: [
      { isArray: true, label: 'In', operator: 'in', symbol: 'IN' },
      { isArray: true, label: 'Not in', operator: 'notIn', symbol: 'NOT IN' },
    ],
    group: 'list',
  },
  {
    filters: [
      {
        hasValue: false,
        label: 'Is null',
        operator: 'isNull',
        symbol: 'IS NULL',
      },
      {
        hasValue: false,
        label: 'Is not null',
        operator: 'isNotNull',
        symbol: 'IS NOT NULL',
      },
    ],
    group: 'null',
  },
] as const satisfies {
  group: FilterGroup
  filters: Filter[]
}[]

// oxlint-disable-next-line unicorn/prefer-array-flat-map -- flatMap widens the `as const` tuple union and breaks Filter typing
export const FILTERS_LIST = FILTERS_GROUPED.map((group) => group.filters).flat()

export const FILTER_OPERATORS = FILTERS_LIST.map((filter) => filter.operator)
