import type { CSSProperties } from 'react'

import { GUTTER_WIDTH } from './constants'

export interface GridColumn {
  id: string
  size: number
  /** Holds its slot while other columns are dragged around it. */
  fixed?: boolean
  /** Sticks to the left edge and, like `fixed`, holds its slot; pinned columns must lead the list. */
  pinned?: boolean
}

// A custom property name must be a plain ident: `setProperty` takes the name
// literally while `var()` unescapes it, so a `CSS.escape`d id never matches.
export const columnVars = (id: string) => {
  const key = id.replaceAll(
    /[^a-zA-Z0-9-]/gu,
    (char) => `_${char.codePointAt(0)}_`
  )
  return {
    shift: `--grid-shift-${key}`,
    width: `--grid-width-${key}`,
  }
}

export const pinnedCount = (columns: GridColumn[]) => {
  const index = columns.findIndex((column) => !column.pinned)
  return index === -1 ? columns.length : index
}

// Sums the live width variables, not `size`, so pinned offsets follow a resize drag before it commits.
const pinnedLeft = (columns: GridColumn[], index: number) =>
  `calc(${[`${GUTTER_WIDTH}px`, ...columns.slice(0, index).map((column) => `var(${columnVars(column.id).width})`)].join(' + ')})`

/** How far the pinned columns reach from the left edge. */
export const pinnedWidth = (columns: GridColumn[]) => {
  const count = pinnedCount(columns)
  return count > 0 ? pinnedLeft(columns, count) : '0px'
}

export const columnStyle = (
  columns: GridColumn[],
  column: GridColumn,
  index: number
): CSSProperties => {
  const vars = columnVars(column.id)
  return {
    flexShrink: 0,
    translate: `var(${vars.shift})`,
    width: `var(${vars.width})`,
    ...(column.pinned && {
      left: pinnedLeft(columns, index),
      position: 'sticky',
    }),
  }
}

export const columnSlots = (columns: GridColumn[]) => {
  let left = 0
  return new Map(
    columns.map((column) => {
      const slot = left
      left += column.size
      return [column.id, slot]
    })
  )
}
