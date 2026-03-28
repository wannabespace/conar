import type { Filter, FilterGroup } from '@conar/shared/filters'
import { createContext } from '@fluentui/react-context-selector'
import { use } from 'react'

export interface Column {
  id: string
  type: string
}

export const FilterInternalContext = createContext<{
  columns: Column[]
  filtersGrouped: { group: FilterGroup, filters: Filter[] }[]
}>(null!)

export function useInternalContext() {
  return use(FilterInternalContext)
}
