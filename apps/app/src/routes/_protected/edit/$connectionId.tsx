import { title } from '@tamery/shared/title'
import { tryCatchAsync } from '@tamery/shared/utils'
import { createFileRoute, getRouteApi, redirect } from '@tanstack/react-router'
import { toast } from 'sonner'

import { ConnectionPage } from '~/modules/connection-form/components/connection-page'
import { formValuesOf } from '~/modules/connection-form/lib/connection-form'

import { useUpdateConnection } from './-lib/use-update-connection'

const { useLoaderData } = getRouteApi('/_protected/edit/$connectionId')

const EditConnectionPage = () => {
  const { connection, defaultValues, mode } = useLoaderData()
  const { mutateAsync } = useUpdateConnection(connection.id)
  return (
    <ConnectionPage
      defaultValues={defaultValues}
      mode={mode}
      persist={(saved) => mutateAsync(saved)}
    />
  )
}

export const Route = createFileRoute('/_protected/edit/$connectionId')({
  loader: async ({ context: { collections }, params }) => {
    const connection = collections.connectionsCollection.get(
      params.connectionId
    )
    if (!connection) {
      throw redirect({ to: '/' })
    }
    const { data: connectionString } = await tryCatchAsync(() =>
      collections.connectionStringsCollection.utils.decrypt(connection.id)
    )
    if (connectionString === null) {
      toast.error(`Couldn't edit ${connection.name}`, {
        description: 'Its server details aren’t on this device.',
      })
      throw redirect({ to: '/' })
    }
    const stored = collections.connectionStringsCollection.get(connection.id)
    return {
      connection,
      defaultValues: formValuesOf(connection, connectionString),
      mode: {
        kind: 'edit' as const,
        missingSecrets: stored?.missingSecrets ?? [],
        name: connection.name,
        passwordElsewhere:
          connection.isPasswordExists && !stored?.isPasswordPopulated,
      },
    }
  },
  component: EditConnectionPage,
  head: () => ({
    meta: [{ title: title('Edit connection') }],
  }),
})
