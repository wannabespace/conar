import type { ConnectionType } from '@tamery/shared/enums/connection-type'
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
  connectionType,
  entry,
  labels,
  onPeek,
  props,
}: {
  cell: DataGridCell
  connectionType: ConnectionType
  entry: GridEntry
  labels?: Map<string, string>
  onPeek: OpenPeek
  props?: CellGeometry
}) => {
  const sessionStore = useTableSessionStore()
  const key = entry.kind === 'saved' ? draftKey(entry.keys, column.id) : null
  const draft = useSubscription(sessionStore, {
    selector: (state) => (key ? state.drafts[key] : undefined),
  })
  const newRow = useSubscription(sessionStore, {
    selector: (state) =>
      entry.kind === 'new'
        ? state.newRows.find((staged) => staged.id === entry.newRow.id)
        : undefined,
  })
  const flash = useSubscription(sessionStore, {
    selector: (state) =>
      key && state.flash?.keys.has(key) ? state.flash.at : undefined,
  })
  const value = draft ? draft.value : row[column.id]

  return (
    <TableCell
      {...props}
      column={column}
      connectionType={connectionType}
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
