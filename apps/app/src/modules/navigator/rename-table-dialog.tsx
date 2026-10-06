import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi, useParams, useRouter } from '@tanstack/react-router'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'

import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { renameTableQuery } from '~/core/queries/tables/rename'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import type { TableDialogRequest } from '~/core/table/table-dialog'
import { TableDialog } from '~/core/table/table-dialog'
import { tableTabId } from '~/core/tabs/ids'
import { queryClient } from '~/lib/query-client'

import { pinnedTable } from './pinned-tables'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

interface RenameTableDialogProps {
  ref: React.RefObject<{
    rename: (schema: string, table: string) => void
  } | null>
}

export const RenameTableDialog = ({ ref }: RenameTableDialogProps) => {
  const { connectionResource } = useRouteContext()
  const { tabId: activeTabId } = useParams({ strict: false })
  const router = useRouter()
  const [request, setRequest] = useState<TableDialogRequest | null>(null)
  const { data: tablesAndSchemas } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource })
  )
  const schemas = tablesAndSchemas?.schemas ?? []

  useImperativeHandle(ref, () => ({
    rename: (schema, name) => setRequest({ schema, table: { name, schema } }),
  }))

  const { mutate: renameTable, isPending } = useMutation({
    meta: { event: 'table_renamed' },
    mutationFn: async ({
      newTable,
      schema,
      table,
    }: {
      newTable: string
      schema: string
      table: string
    }) => {
      await renameTableQuery({ newTable, oldTable: table, schema }).run(
        await connectionResourceToQueryParams(connectionResource)
      )
    },
    onError: (error) => {
      toast.error(`Failed to rename table "${error.message}".`)
    },
    onSuccess: async (_, { newTable, schema, table }) => {
      toast.success(`Table "${table}" successfully renamed to "${newTable}"`)
      setRequest(null)

      await queryClient.invalidateQueries({
        queryKey: ['connection-resource', connectionResource.id],
      })
      pinnedTable.rename(connectionResource.id, schema, table, newTable)

      if (activeTabId === tableTabId(schema, table)) {
        router.navigate({
          params: {
            resourceId: connectionResource.id,
            tabId: tableTabId(schema, newTable),
          },
          replace: true,
          to: '/connection/$resourceId/$tabId',
        })
      }
    },
  })

  return (
    <TableDialog
      request={request}
      schemas={schemas.map(({ name }) => name)}
      isTaken={(schema, name) =>
        schemas.some(
          (entry) =>
            entry.name === schema &&
            entry.tables.some((table) => table.name === name)
        )
      }
      pending={isPending}
      onOpenChange={(open) => !open && setRequest(null)}
      onSubmit={({ table }, schema, newTable) =>
        table && renameTable({ newTable, schema, table: table.name })
      }
    />
  )
}
