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

export interface TableCellProps extends Omit<ComponentProps<'div'>, 'id'>, Pick<ColumnRenderer, 'size' | 'id'> {
  rowIndex: number
  columnIndex: number
  value: unknown
  isFirst: boolean
  isLast: boolean
}

export interface TableHeaderCellProps extends ComponentProps<'div'>, Pick<ColumnRenderer, 'size'> {
  columnIndex: number
  isFirst: boolean
  isLast: boolean
}

export interface ColumnRenderer {
  id: string
  size: number
  cell?: ComponentType<TableCellProps>
  header?: ComponentType<TableHeaderCellProps>
}
