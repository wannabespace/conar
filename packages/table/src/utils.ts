import type { CSSProperties } from 'react'

const SPACE_DOT_REGEX = /[\s.]+/gu
export const prepareColumnId = (id: string) =>
  id.trim().replace(SPACE_DOT_REGEX, '_')

export const columnWidthProperty = (id: string) =>
  `--table-column-width-${prepareColumnId(id)}`

export const getBaseColumnStyle = ({
  id,
  defaultSize,
}: {
  id: string
  defaultSize: number
}): CSSProperties => ({
  flexShrink: 0,
  height: '100%',
  width: `var(${columnWidthProperty(id)}, ${defaultSize}px)`,
})

export type ColumnPosition = 'first' | 'last' | 'middle'

export const getColumnPosition = (
  index: number,
  columnCount: number
): ColumnPosition => {
  if (index === 0) {
    return 'first'
  }
  if (index === columnCount - 1) {
    return 'last'
  }
  return 'middle'
}

export const formatCellValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}
