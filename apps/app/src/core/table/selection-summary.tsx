import { useSubscription } from 'seitu/react'

import type { CursorStore, DataGridCell } from './cell/cursor'
import { isNumericColumn } from './cell/utils'
import type { GridCursor } from './grid-cursor'

const format = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })

const summarize = (
  cells: DataGridCell[],
  getValue: (cell: DataGridCell) => unknown
): [string, number][] => {
  const filled = cells.filter((cell) => {
    const value = getValue(cell)
    return value !== null && value !== undefined && value !== ''
  })
  const numbers = filled
    .filter((cell) => isNumericColumn(cell.column))
    .map((cell) => Number(getValue(cell)))
    .filter((value) => Number.isFinite(value))
  const count: [string, number] = ['Count', filled.length]
  if (numbers.length === 0) {
    return [count]
  }
  const sum = numbers.reduce((total, value) => total + value, 0)
  return [
    ['Sum', sum],
    ['Average', sum / numbers.length],
    ['Min', Math.min(...numbers)],
    ['Max', Math.max(...numbers)],
    count,
  ]
}

export const SelectionSummary = ({
  cursor,
  getValue,
  store,
}: {
  cursor: GridCursor
  getValue: (cell: DataGridCell) => unknown
  store: CursorStore
}) => {
  const range = useSubscription(store, {
    selector: ({ anchor, cursor: at }) => (anchor ? { anchor, at } : null),
  })
  const cells = range ? cursor.selection().flat() : []
  if (cells.length < 2) {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center">
      <div className="bg-popover/70 ring-foreground/4 flex h-7 items-center gap-3 rounded-lg px-3 text-xs shadow-md ring backdrop-blur">
        {summarize(cells, getValue).map(([label, value]) => (
          <span key={label} className="flex gap-1 whitespace-nowrap">
            <span className="text-muted-foreground">{label}</span>
            <span data-mask className="tabular-nums">
              {format.format(value)}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
