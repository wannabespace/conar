import type { Filter, FilterGroup } from '@conar/shared/filters'
import type { Column } from './context'
import { FilterInternalContext } from './context'

export function FiltersProvider({
  children,
  columns,
  filtersGrouped,
}: {
  children: React.ReactNode
  columns: Column[]
  filtersGrouped: { group: FilterGroup, filters: Filter[] }[]
}) {
  return (
    <FilterInternalContext value={{ columns, filtersGrouped }}>
      {children}
    </FilterInternalContext>
  )
}
