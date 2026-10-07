import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { useState } from 'react'

import { isComputed } from '~/core/queries/tables/columns'
import type { Column } from '~/core/table/cell/utils'

import type { ColumnActions } from '../../lib/column-menu'
import { isSortable } from '../../lib/column-menu'
import { columnDialogRef } from './column-dialog'
import type { DistinctValuesTarget } from './distinct-values'
import { DistinctValues, hasDistinctValues } from './distinct-values'

export const useColumnActions = ({
  connectionType,
  editable,
  schema,
  table,
}: {
  connectionType: ConnectionType
  editable: boolean
  schema: string
  table: string
}) => {
  const [distinct, setDistinct] = useState<DistinctValuesTarget | null>(null)

  const actionsOf = (column: Column): ColumnActions => ({
    onDistinctValues: hasDistinctValues(connectionType, column)
      ? (anchor) => setDistinct({ anchor, column })
      : undefined,
    onEdit:
      editable && !isComputed(column)
        ? () => columnDialogRef.current?.edit(column)
        : undefined,
    sortable: isSortable(connectionType, column),
  })

  const dialogs = (
    <DistinctValues
      schema={schema}
      table={table}
      target={distinct}
      onClose={() => setDistinct(null)}
    />
  )

  return { actionsOf, dialogs }
}
