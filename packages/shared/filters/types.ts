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
}

export const FILTER_GROUPS = {
  comparison: 'Comparison',
  text: 'Text Search',
  list: 'List Operations',
  null: 'Null Checks',
} as const

export type FilterGroup = keyof typeof FILTER_GROUPS
