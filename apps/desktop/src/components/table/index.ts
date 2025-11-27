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
