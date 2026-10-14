import { title } from '@tamery/shared/title'
import { tryCatchAsync } from '@tamery/shared/utils'
import { createFileRoute, getRouteApi, redirect } from '@tanstack/react-router'
import { toast } from 'sonner'

import { needsLocalDetails } from '~/core/connection/fetching'
import { ConnectionPage } from '~/modules/connection-form/components/connection-page'
import { formValuesOf } from '~/modules/connection-form/lib/connection-form'
import { editModeOf } from '~/modules/connection-form/lib/form-mode'

import { useUpdateConnection } from './-lib/use-update-connection'

const { useLoaderData } = getRouteApi('/_protected/edit/$connectionId')

const EditConnectionPage = () => {
  const { connection, defaultValues, mode } = useLoaderData()
  const { mutateAsync } = useUpdateConnection(connection.id)
  return (
    <ConnectionPage
      defaultValues={defaultValues}
      mode={mode}
      onSave={(saved) => mutateAsync(saved)}
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
    if (connectionString === null && !needsLocalDetails(connection, null)) {
      toast.error(`Couldn't edit ${connection.name}`, {
        description: 'Its server details aren’t on this device.',
      })
      throw redirect({ to: '/' })
    }
    return {
      connection,
      defaultValues: formValuesOf(connection, connectionString),
      mode: editModeOf(
        connection,
        collections.connectionStringsCollection.get(connection.id),
        'all'
      ),
    }
  },
  component: EditConnectionPage,
  head: () => ({
    meta: [{ title: title('Edit connection') }],
  }),
})
