import type { Dialect } from '@tamery/shared/enums/connection-type'
import { useSubscription } from 'seitu/react'

import type { CellGeometry } from '~/core/table/cell/cell'
import { TableCell } from '~/core/table/cell/cell'
import type { DataGridCell } from '~/core/table/cursor'
import type { GridEntry } from '~/core/table/session'
import { draftKey, useTableSessionStore } from '~/core/table/session'

import type { OpenPeek } from '../references/reference-buttons'
import { ReferenceButtons } from '../references/reference-buttons'

export const TableBodyCell = ({
  cell: { column, row, rowIndex },
  dialect,
  entry,
  geometry,
  labels,
  onPeek,
}: {
  cell: DataGridCell
  dialect: Dialect
  entry: GridEntry
  geometry?: CellGeometry
  labels?: Map<string, string>
  onPeek: OpenPeek
}) => {
  const sessionStore = useTableSessionStore()
  const key = entry.kind === 'saved' ? draftKey(entry.keys, column.id) : null
  const { draft, flash, newRow } = useSubscription(sessionStore, {
    selector: (state) => ({
      draft: key ? state.drafts[key] : undefined,
      flash: key && state.flash?.keys.has(key) ? state.flash.at : undefined,
      newRow:
        entry.kind === 'new'
          ? state.newRows.find((staged) => staged.id === entry.newRow.id)
          : undefined,
    }),
  })
  const value = draft ? draft.value : row[column.id]

  return (
    <TableCell
      {...geometry}
      column={column}
      dialect={dialect}
      draft={newRow ?? draft}
      flash={flash}
      label={
        value === null || value === undefined
          ? undefined
          : labels?.get(String(value))
      }
      rowIndex={rowIndex}
      value={value}
    >
      <ReferenceButtons column={column} onPeek={onPeek} value={value} />
    </TableCell>
  )
}
