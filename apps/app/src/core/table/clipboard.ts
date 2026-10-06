import { parseTsv, toTsv } from '@tamery/shared/files'
import { copy } from '@tamery/ui/lib/copy'

import { createTransformer } from '~/core/transformers/create-transformer'
import { posthog } from '~/lib/posthog'

import type { CellPosition, DataGridCell, GridCursor } from './cursor'
import { rangeOf } from './cursor'

// A single cell copies its raw text, whose newlines and quotes would read back as a block; paste matches it to keep one value.
let copiedCell: string | null = null

const pasted = (
  cell: DataGridCell,
  text: string
): [DataGridCell, string | null] => [
  cell,
  text === '' && cell.column.isNullable ? null : text,
]

export const gridClipboard = (cursor: GridCursor) => {
  const { cellAt, columns, indexOf, rows, store } = cursor

  const textOf = (cell: DataGridCell) => {
    const value = cursor.getValue(cell)
    return value === null || value === undefined
      ? ''
      : createTransformer(cursor.connectionType, cell.column)
          .fromConnection(value)
          .toRaw()
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
    cursor.writeAll(writes)
    const corner = columns[left]
    const end =
      columns[
        Math.min(
          left + Math.max(...block.map((values) => values.length)) - 1,
          columns.length - 1
        )
      ]
    if (corner && end) {
      cursor.select(
        { column: corner.id, row: top },
        {
          column: end.id,
          row: Math.min(top + block.length - 1, rows.length - 1),
        }
      )
    }
  }

  return {
    copy: () => {
      const cells = cursor.selection()
      const [only, ...rest] = cells.flat()
      posthog.capture('cells_copied', { count: rest.length + 1 })
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
    /** One value over the cursor cell types into its editor, so a misfit shows there; anything else is written at once. */
    paste: (text: string) => {
      const block = text === copiedCell ? [[text]] : parseTsv(text)
      const at = store.get().cursor
      const [first] = block
      if (!at || !first) {
        return
      }
      posthog.capture('cells_pasted', { rows: block.length })
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
        cursor.edit(value)
        cursor.commit()
        return
      }
      cursor.writeAll(
        cursor
          .selection()
          .flat()
          .map((cell) => pasted(cell, value))
      )
    },
  }
}
