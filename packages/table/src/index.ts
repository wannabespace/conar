import type { CSSProperties, ReactNode } from 'react'

import type { ColumnPosition } from './utils'

export * from './body'
export * from './header'
export * from './provider'
export * from './table'
export type { ColumnPosition } from './utils'

export interface TableCellProps extends Pick<ColumnRenderer, 'size' | 'id'> {
  style: CSSProperties
  rowIndex: number
  columnIndex: number
  value: unknown
  position: ColumnPosition
}

export interface TableHeaderCellProps extends Pick<
  ColumnRenderer,
  'size' | 'id'
> {
  style: CSSProperties
  columnIndex: number
  position: ColumnPosition
}

export interface ColumnRenderer {
  id: string
  size: number
  cell?: (props: TableCellProps) => ReactNode
  header?: (props: TableHeaderCellProps) => ReactNode
}
