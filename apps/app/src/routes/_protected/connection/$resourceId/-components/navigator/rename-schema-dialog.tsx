import { Dialog, DialogContent } from '@tamery/ui/components/dialog'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi, useParams, useRouter } from '@tanstack/react-router'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'

import { renameSchemaQuery } from '~/entities/connection/queries/schemas/rename'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries/tables/list'
import { connectionResourceToQueryParams } from '~/entities/connection/runtime/query'
import { parseTabId } from '~/entities/connection/store/tabs/ids'
import { queryClient } from '~/lib/query-client'

import { SchemaForm } from './create-schema-dialog'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const RenameSchemaDialog = ({
  ref,
}: {
  ref: React.RefObject<{ rename: (schema: string) => void } | null>
}) => {
  const { connectionResource } = useRouteContext()
  const { tabId } = useParams({ strict: false })
  const router = useRouter()
  const [schema, setSchema] = useState('')
  const [open, setOpen] = useState(false)
  const { data: tablesAndSchemas } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource })
  )

  useImperativeHandle(ref, () => ({
    rename: (next) => {
      setSchema(next)
      setOpen(true)
    },
  }))

  const { mutate: renameSchema, isPending } = useMutation({
    mutationFn: async (name: string) => {
      await renameSchemaQuery({ name, schema }).run(
        await connectionResourceToQueryParams(connectionResource)
      )
    },
    onSuccess: async () => {
      setOpen(false)
      queryClient.invalidateQueries(
        resourceTablesAndSchemasQueryOptions({ connectionResource })
      )
      const active = tabId ? parseTabId(tabId) : null
      if (active?.type === 'table' && active.schema === schema) {
        await router.navigate({
          to: '/connection/$resourceId',
          params: { resourceId: connectionResource.id },
        })
      }
    },
    onError: (error) => {
      toast.error(`Failed to rename schema "${error.message}".`)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <SchemaForm
          key={schema}
          schema={schema}
          isTaken={(name) =>
            !!tablesAndSchemas?.schemas.some((other) => other.name === name)
          }
          pending={isPending}
          onSubmit={renameSchema}
        />
      </DialogContent>
    </Dialog>
  )
}
