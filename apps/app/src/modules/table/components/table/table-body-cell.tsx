import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { GridCellProps } from '@tamery/table'
import { useSubscription } from 'seitu/react'

import { TableCell } from '~/core/table/cell/cell'
import type { DataGridCell } from '~/core/table/cell/cursor'
import {
  draftKey,
  getRowPrimaryKeysValues,
  useTableSessionStore,
} from '~/core/table/session'

import { ReferenceButtons } from '../references/reference-buttons'

export const TableBodyCell = ({
  cell: { column, row, rowIndex },
  connectionType,
  labels,
  primaryColumns,
  props,
}: {
  cell: DataGridCell
  connectionType: ConnectionType
  labels?: Map<string, string>
  primaryColumns: string[]
  props: GridCellProps
}) => {
  const sessionStore = useTableSessionStore()
  const key =
    primaryColumns.length > 0
      ? draftKey(getRowPrimaryKeysValues(row, primaryColumns), column.id)
      : null
  const draft = useSubscription(sessionStore, {
    selector: (state) => (key ? state.drafts[key] : undefined),
  })
  const newRow = useSubscription(sessionStore, {
    selector: (state) => state.newRows.at(rowIndex),
  })
  const flash = useSubscription(sessionStore, {
    selector: (state) =>
      key && state.flash?.keys.has(key) ? state.flash.at : undefined,
  })
  const value = draft ? draft.value : row[column.id]

  return (
    <TableCell
      column={column}
      connectionType={connectionType}
      draft={newRow ?? draft}
      flash={flash}
      isDragging={props.isDragging}
      label={
        value === null || value === undefined
          ? undefined
          : labels?.get(String(value))
      }
      pinned={props.column.pinned}
      rowIndex={rowIndex}
      size={props.column.size}
      // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
      style={props.style}
      value={value}
    >
      <ReferenceButtons column={column} value={value} />
    </TableCell>
  )
}
