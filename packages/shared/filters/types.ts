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

export const enabledFilters = <T extends { disabled?: boolean }>(
  filters: T[]
): T[] => filters.filter((filter) => !filter.disabled)

export const FILTER_GROUPS = {
  comparison: 'Comparison',
  list: 'List Operations',
  null: 'Null Checks',
  text: 'Text Search',
} as const

export type FilterGroup = keyof typeof FILTER_GROUPS
