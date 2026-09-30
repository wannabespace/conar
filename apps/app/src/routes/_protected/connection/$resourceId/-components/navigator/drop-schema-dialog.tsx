import { useMutation } from '@tanstack/react-query'
import { getRouteApi, useParams, useRouter } from '@tanstack/react-router'
import { useImperativeHandle, useState } from 'react'

import { capabilitiesOf } from '~/entities/connection/capabilities'
import { dropSchemaQuery } from '~/entities/connection/queries/schemas/drop'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries/tables/list'
import { connectionResourceToQueryParams } from '~/entities/connection/runtime/query'
import { parseTabId } from '~/entities/connection/store/tabs/ids'
import { queryClient } from '~/lib/query-client'

import { DropDialog } from '../../-tabs/definitions/-components/drop-dialog'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const DropSchemaDialog = ({
  ref,
}: {
  ref: React.RefObject<{ drop: (schema: string) => void } | null>
}) => {
  const { connection, connectionResource } = useRouteContext()
  const { tabId } = useParams({ strict: false })
  const router = useRouter()
  const [schema, setSchema] = useState('')
  const [open, setOpen] = useState(false)
  const [cascade, setCascade] = useState(false)

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: async () => {
      await dropSchemaQuery({ cascade, schema }).run(
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
  })

  useImperativeHandle(ref, () => ({
    drop: (next) => {
      setSchema(next)
      setCascade(false)
      reset()
      setOpen(true)
    },
  }))

  return (
    <DropDialog
      cascadable={capabilitiesOf(connection.type).cascade}
      cascade={cascade}
      error={error}
      name={schema}
      noun="schema"
      open={open}
      pending={isPending}
      onCascadeChange={setCascade}
      onDrop={() => mutate()}
      onOpenChange={setOpen}
    />
  )
}
