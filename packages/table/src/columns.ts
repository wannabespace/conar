import type { CSSProperties } from 'react'

export interface GridColumn {
  id: string
  size: number
  /** Holds its slot while other columns are dragged around it. */
  fixed?: boolean
  /** Sticks to the left edge; pinned columns must lead the list. */
  pinned?: boolean
}

// A custom property name must be a plain ident: `setProperty` takes the name
// literally while `var()` unescapes it, so a `CSS.escape`d id never matches.
const varKey = (id: string) =>
  id.replaceAll(/[^a-zA-Z0-9-]/gu, (char) => `_${char.codePointAt(0)}_`)

export const columnVars = (id: string) => {
  const key = varKey(id)
  return {
    shift: `--grid-shift-${key}`,
    width: `--grid-width-${key}`,
  }
}

export const columnStyle = (id: string): CSSProperties => {
  const vars = columnVars(id)
  return {
    flexShrink: 0,
    translate: `var(${vars.shift})`,
    width: `var(${vars.width})`,
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
