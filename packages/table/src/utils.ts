import type { CSSProperties } from 'react'

// setProperty stores a custom property name verbatim while var() unescapes it,
// so only the var() reference may pass the id through CSS.escape.
export const columnWidthProperty = (id: string) => `--table-column-width-${id}`

export const getBaseColumnStyle = ({
  id,
  defaultSize,
}: {
  id: string
  defaultSize: number
}): CSSProperties => ({
  flexShrink: 0,
  height: '100%',
  width: `var(${columnWidthProperty(CSS.escape(id))}, ${defaultSize}px)`,
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
