export interface Filter {
  label: string
  operator: string
  isArray?: boolean
  hasValue?: boolean
}

export interface ActiveFilter<F extends Filter = Filter, V = unknown> {
  column: string
  ref: F
  values: V[]
  disabled?: boolean
}

export function enabledFilters<T extends { disabled?: boolean }>(filters: T[]): T[] {
  return filters.filter(filter => !filter.disabled)
}

export const FILTER_GROUPS = {
  comparison: 'Comparison',
  text: 'Text Search',
  list: 'List Operations',
  null: 'Null Checks',
} as const

export type FilterGroup = keyof typeof FILTER_GROUPS
