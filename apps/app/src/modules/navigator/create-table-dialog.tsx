import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { createRef, useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'

import { capabilitiesOf, defaultSchemaOf } from '~/core/catalog/capabilities'
import { createTableQuery } from '~/core/queries/tables/create'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import type { TableDialogRequest } from '~/core/table/table-dialog'
import { TableDialog } from '~/core/table/table-dialog'
import { openTab } from '~/core/tabs/actions'
import { tableTabId } from '~/core/tabs/ids'
import { queryClient } from '~/lib/query-client'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const createTableDialogRef = createRef<{
  create: (schema?: string) => void
}>()

export const CreateTableDialog = () => {
  const { connection, connectionResource } = useRouteContext()
  const router = useRouter()
  const [request, setRequest] = useState<TableDialogRequest | null>(null)
  const { data: tablesAndSchemas } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource })
  )
  const schemas = tablesAndSchemas?.schemas ?? []

  useImperativeHandle(createTableDialogRef, () => ({
    create: (schema) =>
      setRequest({
        schema:
          schema ??
          defaultSchemaOf(connection.type, connectionResource.name) ??
          schemas[0]?.name ??
          '',
        table: null,
      }),
  }))

  const { mutate: createTable, isPending } = useMutation({
    meta: { event: 'table_created' },
    mutationFn: async ({
      schema,
      table,
    }: {
      schema: string
      table: string
    }) => {
      await createTableQuery({
        columns: [
          {
            name: 'id',
            nullable: false,
            primaryKey: true,
            type: capabilitiesOf(connection.type).idColumnType,
          },
        ],
        schema,
        table,
      }).run(await connectionResourceToQueryParams(connectionResource))
    },
    onError: (error) => {
      toast.error(`Failed to create table "${error.message}".`)
    },
    onSuccess: async (_, { schema, table }) => {
      setRequest(null)
      await queryClient.invalidateQueries({
        queryKey: ['connection-resource', connectionResource.id],
      })
      openTab(connectionResource.id, tableTabId(schema, table))
      router.navigate({
        params: {
          resourceId: connectionResource.id,
          tabId: tableTabId(schema, table),
        },
        to: '/connection/$resourceId/$tabId',
      })
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
      onSubmit={(_, schema, table) => createTable({ schema, table })}
    />
  )
}
