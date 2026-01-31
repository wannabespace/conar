import type { ComponentType, CSSProperties } from 'react'

export * from './body'
export {
  FilterForm,
  FilterItem,
  FiltersProvider,
} from './filters'
export * from './header'
export * from './provider'
export * from './table'
export * from './table-context'
export {
  useShiftSelectionClick,
  type UseShiftSelectionClickOptions,
} from './use-shift-selection-click'
export {
  type SelectionState,
  useShiftSelectionKeyDown,
  type UseShiftSelectionKeyDownOptions,
} from './use-shift-selection-key-down'

export interface TableCellProps extends Pick<ColumnRenderer, 'size' | 'id'> {
  style: CSSProperties
  rowIndex: number
  columnIndex: number
  value: unknown
  position: 'first' | 'last' | 'middle'
}

export interface TableHeaderCellProps extends Pick<ColumnRenderer, 'size' | 'id'> {
  style: CSSProperties
  columnIndex: number
  position: 'first' | 'last' | 'middle'
}

export interface ColumnRenderer {
  id: string
  size: number
  cell?: ComponentType<TableCellProps>
  header?: ComponentType<TableHeaderCellProps>
}

export function getBaseColumnStyle({ id, defaultSize }: { id: string, defaultSize: number }): CSSProperties {
  return {
    width: `var(--table-column-width-${id}, ${defaultSize}px)`,
    height: '100%',
    flexShrink: 0,
    willChange: 'width',
  }
}
