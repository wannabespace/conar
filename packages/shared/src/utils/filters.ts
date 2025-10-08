export interface Filter {
  label: string
  operator: string
  hasValue: boolean
}

export interface ActiveFilter {
  column: string
  ref: Filter
  values: unknown[]
}

export type FilterGroup = keyof typeof FILTER_GROUPS_LABELS

export const FILTER_GROUPS_LABELS = {
  comparison: 'Comparison',
  text: 'Text Search',
  list: 'List Operations',
  null: 'Null Checks',
} as const
