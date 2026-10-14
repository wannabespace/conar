import { title } from '@tamery/shared/title'
import { tryCatchAsync } from '@tamery/shared/utils'
import { createFileRoute, getRouteApi, redirect } from '@tanstack/react-router'

import { ConnectionPage } from '~/modules/connection-form/components/connection-page'
import { formValuesOf } from '~/modules/connection-form/lib/connection-form'

import { useUpdateConnection } from './-lib/use-update-connection'

const { useLoaderData } = getRouteApi('/_protected/edit/$connectionId')

const EditConnectionPage = () => {
  const { connection, defaultValues } = useLoaderData()
  const { mutateAsync } = useUpdateConnection(connection.id)
  return (
    <ConnectionPage
      defaultValues={defaultValues}
      editingName={connection.name}
      persist={mutateAsync}
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
    return {
      connection,
      defaultValues: formValuesOf(connection, connectionString),
    }
  },
  component: EditConnectionPage,
  head: () => ({
    meta: [{ title: title('Edit connection') }],
  }),
})
