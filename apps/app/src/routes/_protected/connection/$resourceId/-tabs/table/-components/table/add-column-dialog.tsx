import { useMutation } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { createRef, useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'

import { capabilitiesOf } from '~/entities/connection/capabilities'
import type { ColumnDialogRequest } from '~/entities/connection/components/column-dialog'
import { ColumnDialog } from '~/entities/connection/components/column-dialog'
import { resourceRowsQueryInfiniteOptions } from '~/entities/connection/queries/rows/list'
import { addColumnQuery } from '~/entities/connection/queries/tables/add-column'
import { resourceColumnsQueryKey } from '~/entities/connection/queries/tables/columns'
import type { NewColumn } from '~/entities/connection/queries/tables/shape'
import { connectionResourceToQueryParams } from '~/entities/connection/runtime/query'
import { queryClient } from '~/lib/query-client'

import { useTableColumnsContext } from '../../-lib/columns'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const addColumnDialogRef = createRef<{ add: () => void }>()

export const AddColumnDialog = ({
  schema,
  table,
}: {
  schema: string
  table: string
}) => {
  const { connection, connectionResource } = useRouteContext()
  const { columns } = useTableColumnsContext()
  const [request, setRequest] = useState<ColumnDialogRequest | null>(null)

  useImperativeHandle(addColumnDialogRef, () => ({
    add: () =>
      setRequest({
        column: null,
        table: {
          columns: columns.map(({ id }) => ({ id, name: id })),
          name: table,
        },
      }),
  }))

  const { mutate: addColumn, isPending } = useMutation({
    mutationFn: async (column: NewColumn) => {
      await addColumnQuery({ column, schema, table }).run(
        await connectionResourceToQueryParams(connectionResource)
      )
    },
    onSuccess: async () => {
      setRequest(null)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: resourceColumnsQueryKey({ connectionResource }),
        }),
        queryClient.invalidateQueries({
          queryKey: resourceRowsQueryInfiniteOptions({
            connectionResource,
            table,
            schema,
            query: { filters: [], orderBy: {} },
          }).queryKey.slice(0, -1),
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Failed to add column "${error.message}".`)
    },
  })

  return (
    <ColumnDialog
      request={request}
      canRename={capabilitiesOf(connection.type).renameColumns}
      columnTypes={capabilitiesOf(connection.type).columnTypes}
      pending={isPending}
      onOpenChange={(open) => !open && setRequest(null)}
      onSubmit={(_, column) => addColumn(column)}
    />
  )
}
