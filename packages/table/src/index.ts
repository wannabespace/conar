import type { CSSProperties, ReactNode } from 'react'

export * from './body'
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

export interface TableHeaderCellProps extends Pick<
  ColumnRenderer,
  'size' | 'id'
> {
  style: CSSProperties
  columnIndex: number
  position: 'first' | 'last' | 'middle'
}

export interface ColumnRenderer {
  id: string
  size: number
  cell?: (props: TableCellProps) => ReactNode
  header?: (props: TableHeaderCellProps) => ReactNode
}
