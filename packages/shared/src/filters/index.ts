export interface Filter {
  label: string
  operator: string
  hasValue: boolean
}

export interface ActiveFilter<T extends Filter = Filter> {
  column: string
  ref: T
  values: unknown[]
}

export const FILTER_GROUPS_LABELS = {
  comparison: 'Comparison',
  text: 'Text Search',
  list: 'List Operations',
  null: 'Null Checks',
} as const

export type FilterGroup = keyof typeof FILTER_GROUPS_LABELS
