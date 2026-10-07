import { Dialog, DialogContent } from '@tamery/ui/components/dialog'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { createRef, useImperativeHandle, useState } from 'react'

import { defaultSchemaOf } from '~/core/catalog/capabilities'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { createViewQuery } from '~/core/queries/views/create'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import { openTab } from '~/core/tabs/actions'
import { tableTabId } from '~/core/tabs/ids'
import { queryClient } from '~/lib/query-client'

import type { NewView } from './view-form'
import { ViewForm } from './view-form'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const createViewDialogRef = createRef<{
  create: (schema?: string) => void
}>()

export const CreateViewDialog = () => {
  const { connection, connectionResource } = useRouteContext()
  const router = useRouter()
  const [schema, setSchema] = useState<string | null>(null)
  const [shownSchema, setShownSchema] = useState(schema)
  if (schema !== null && schema !== shownSchema) {
    setShownSchema(schema)
  }
  const { data: tablesAndSchemas } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource })
  )
  const schemas = tablesAndSchemas?.schemas ?? []

  const {
    error,
    isPending,
    mutate: createView,
    reset,
  } = useMutation({
    meta: { event: 'view_created' },
    mutationFn: async (view: NewView) => {
      await createViewQuery(view).run(
        await connectionResourceToQueryParams(connectionResource)
      )
    },
    onSuccess: async (_, { schema: created, view }) => {
      setSchema(null)
      await queryClient.invalidateQueries({
        queryKey: ['connection-resource', connectionResource.id],
      })
      openTab(connectionResource.id, tableTabId(created, view))
      router.navigate({
        params: {
          resourceId: connectionResource.id,
          tabId: tableTabId(created, view),
        },
        to: '/connection/$resourceId/$tabId',
      })
    },
  })

  useImperativeHandle(createViewDialogRef, () => ({
    create: (target) => {
      reset()
      setSchema(
        target ??
          defaultSchemaOf(connection.type, connectionResource.name) ??
          schemas[0]?.name ??
          ''
      )
    },
  }))

  return (
    <Dialog
      open={schema !== null}
      onOpenChange={(open) => !open && setSchema(null)}
    >
      <DialogContent>
        {shownSchema !== null && (
          <ViewForm
            error={error}
            initialSchema={shownSchema}
            isTaken={(target, name) =>
              schemas.some(
                (entry) =>
                  entry.name === target &&
                  entry.tables.some((table) => table.name === name)
              )
            }
            pending={isPending}
            schemas={schemas.map(({ name }) => name)}
            onSubmit={createView}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
