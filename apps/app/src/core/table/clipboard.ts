import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { GridRow } from '@tamery/table'
import { copy } from '@tamery/ui/lib/copy'
import { toast } from 'sonner'

import {
  createTransformer,
  parseCellText,
} from '~/core/transformers/create-transformer'

import type { CellPosition, CursorStore, DataGridCell } from './cell/cursor'
import { rangeOf } from './cell/cursor'
import type { Column } from './cell/utils'
import { parseTsv, toTsv } from './tsv'

// A single cell copies its raw text, whose newlines and quotes would read back as a block; paste matches it to keep one value.
let copiedCell: string | null = null

const pasted = (
  cell: DataGridCell,
  text: string
): [DataGridCell, string | null] => [
  cell,
  text === '' && cell.column.isNullable ? null : text,
]

export const gridClipboard = ({
  cellAt,
  columns,
  connectionType,
  getValue,
  indexOf,
  isEditable,
  onEdit,
  rows,
  selection,
  store,
}: {
  cellAt: (position: CellPosition | null) => DataGridCell | null
  columns: Column[]
  connectionType: ConnectionType
  getValue: (cell: DataGridCell) => unknown
  indexOf: (column: string) => number
  isEditable: (column: Column) => boolean
  onEdit?: (cell: DataGridCell, value: unknown) => void
  rows: GridRow[]
  selection: () => DataGridCell[][]
  store: CursorStore
}) => {
  const textOf = (cell: DataGridCell) => {
    const value = getValue(cell)
    return value === null || value === undefined
      ? ''
      : createTransformer(connectionType, cell.column)
          .fromConnection(value)
          .toRaw()
  }

  const writeAll = (writes: [DataGridCell, string | null][]) => {
    let rejected = 0
    for (const [cell, text] of writes) {
      if (!isEditable(cell.column)) {
        continue
      }
      const { data, error } = parseCellText(connectionType, cell.column, text)
      if (error) {
        rejected += 1
      } else {
        onEdit?.(cell, data)
      }
    }
    if (rejected > 0) {
      toast.error(
        `${rejected} value${rejected === 1 ? '' : 's'} did not fit ${rejected === 1 ? 'its column' : 'their columns'}`
      )
    }
  }

  const pasteBlock = (block: string[][], at: CellPosition) => {
    const range = rangeOf(store.get(), indexOf)
    const top = range?.top ?? at.row
    const left = range?.left ?? indexOf(at.column)
    const writes: [DataGridCell, string | null][] = []
    for (const [rowOffset, values] of block.entries()) {
      for (const [columnOffset, value] of values.entries()) {
        const cell = cellAt({
          column: columns[left + columnOffset]?.id ?? '',
          row: top + rowOffset,
        })
        if (cell) {
          writes.push(pasted(cell, value))
        }
      }
    }
    writeAll(writes)
    const corner = columns[left]
    const end =
      columns[
        Math.min(
          left + Math.max(...block.map((values) => values.length)) - 1,
          columns.length - 1
        )
      ]
    if (corner && end) {
      store.set((state) => ({
        ...state,
        anchor: { column: corner.id, row: top },
        cursor: {
          column: end.id,
          row: Math.min(top + block.length - 1, rows.length - 1),
        },
      }))
    }
  }

  return {
    copy: () => {
      const cells = selection()
      const [only, ...rest] = cells.flat()
      if (only && rest.length === 0) {
        copiedCell = textOf(only)
        copy(copiedCell, 'Cell value copied')
        return
      }
      copiedCell = null
      copy(
        toTsv(cells.map((row) => row.map(textOf))),
        `${rest.length + 1} cells copied`
      )
    },
    /** Returns the one value to type over the cursor cell, so a misfit shows in its editor; anything else is written here. */
    paste: (text: string): string | undefined => {
      const block = text === copiedCell ? [[text]] : parseTsv(text)
      const at = store.get().cursor
      const [first] = block
      if (!at || !first) {
        return
      }
      if (block.length > 1 || first.length > 1) {
        pasteBlock(block, at)
        return
      }
      const value = first[0] ?? ''
      if (
        value &&
        !rangeOf(store.get(), indexOf) &&
        cellAt(at)?.column.uiType !== 'boolean'
      ) {
        return value
      }
      writeAll(
        selection()
          .flat()
          .map((cell) => pasted(cell, value))
      )
    },
    writeAll,
  }
}
