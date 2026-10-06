import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { ComponentRef } from 'react'
import { useRef, useState } from 'react'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import type { Column } from '~/core/table/cell/utils'

import type { ColumnActions } from '../../lib/column-menu'
import { DistinctValues, hasDistinctValues } from './distinct-values'
import { RenameColumnDialog } from './rename-column-dialog'

export const useColumnActions = ({
  connectionType,
  schema,
  table,
}: {
  connectionType: ConnectionType
  schema: string
  table: string
}) => {
  const renameRef = useRef<ComponentRef<typeof RenameColumnDialog>>(null)
  const [distinct, setDistinct] = useState<{
    anchor: Element
    column: Column
  } | null>(null)

  const actionsOf = (column: Column): ColumnActions => ({
    onDistinctValues: hasDistinctValues(connectionType, column)
      ? (anchor) => setDistinct({ anchor, column })
      : undefined,
    onRename:
      capabilitiesOf(connectionType).renameColumns && !column.primaryKey
        ? () => renameRef.current?.rename(schema, table, column.id)
        : undefined,
  })

  const dialogs = (
    <>
      <RenameColumnDialog ref={renameRef} />
      <DistinctValues
        schema={schema}
        table={table}
        target={distinct}
        onClose={() => setDistinct(null)}
      />
    </>
  )

  return { actionsOf, dialogs }
}
