import type { ContextSelector } from '@fluentui/react-context-selector'
import type { TableContextType } from './table-context'
import { useContextSelector } from '@fluentui/react-context-selector'
import { TableContext } from './table-context'

export function useTableContext<T>(selector: ContextSelector<TableContextType, T>) {
  return useContextSelector(TableContext, selector)
}
