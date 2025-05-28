import type { ComponentProps, ComponentType } from 'react'

export * from './body'
export {
  FilterForm,
  FilterItem,
  FiltersProvider,
} from './filters'
export type { PageSize } from './footer'
export * from './footer'
export * from './header'
export * from './table'

export const DEFAULT_ROW_HEIGHT = 32
export const DEFAULT_COLUMN_WIDTH = 220

export interface TableCellProps extends Omit<ComponentProps<'div'>, 'id'>, Pick<ColumnRenderer, 'size' | 'id'> {
  rowIndex: number
  columnIndex: number
  value: unknown
}

export interface TableHeaderCellProps extends ComponentProps<'div'> {
  columnIndex: number
}

export interface ColumnRenderer {
  id: string
  size: number
  cell: ComponentType<TableCellProps>
  header: ComponentType<TableHeaderCellProps>
}
