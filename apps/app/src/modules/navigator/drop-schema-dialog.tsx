import { useMutation } from '@tanstack/react-query'
import { getRouteApi, useParams, useRouter } from '@tanstack/react-router'
import { useImperativeHandle, useState } from 'react'

import { DropDialog } from '~/components/drop-dialog'
import { capabilitiesOf } from '~/core/catalog/capabilities'
import { dropSchemaQuery } from '~/core/queries/schemas/drop'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import { parseTableTabId } from '~/core/tabs/ids'
import { queryClient } from '~/lib/query-client'

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
      const active = tabId ? parseTableTabId(tabId) : null
      if (active?.schema === schema) {
        await router.navigate({
          params: { resourceId: connectionResource.id },
          to: '/connection/$resourceId',
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
