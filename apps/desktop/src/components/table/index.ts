import type { ComponentProps, ComponentType } from 'react'

export * from './body'
export {
  FilterForm,
  FilterItem,
  FiltersProvider,
} from './filters'
export * from './header'
export * from './provider'
export * from './table'

export interface TableCellProps extends Pick<ComponentProps<'div'>, 'style' | 'className'>, Pick<ColumnRenderer, 'size' | 'id'> {
  rowIndex: number
  columnIndex: number
  value: unknown
  position: 'first' | 'last' | 'middle'
}

export interface TableHeaderCellProps extends Pick<ComponentProps<'div'>, 'style' | 'className'>, Pick<ColumnRenderer, 'size' | 'id'> {
  columnIndex: number
  position: 'first' | 'last' | 'middle'
}

export interface ColumnRenderer {
  id: string
  size: number
  cell?: ComponentType<TableCellProps>
  header?: ComponentType<TableHeaderCellProps>
}
