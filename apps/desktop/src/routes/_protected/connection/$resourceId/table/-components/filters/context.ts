import type { Filter, FilterGroup } from '@conar/shared/filters'
import type { Column } from '~/entities/connection/components/table/cell'
import { createContext } from '@fluentui/react-context-selector'
import { use } from 'react'

export const FilterInternalContext = createContext<{
  columns: Column[]
  filtersGrouped: { group: FilterGroup, filters: Filter[] }[]
}>(null!)

export function useInternalContext() {
  return use(FilterInternalContext)
}
