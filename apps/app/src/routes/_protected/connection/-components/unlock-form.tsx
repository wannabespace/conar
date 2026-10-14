import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useCollections } from '~/core/collections'
import type { Connection } from '~/core/connection/sync'
import { ConnectionPage } from '~/modules/connection-form/components/connection-page'
import { formValuesOf } from '~/modules/connection-form/lib/connection-form'
import { editModeOf } from '~/modules/connection-form/lib/use-save-connection'

export const UnlockForm = ({
  connection,
  scope,
}: {
  connection: Connection
  scope: 'credentials' | 'details'
}) => {
  const { connectionStringsCollection } = useCollections()
  const { data: connectionString } = useQuery({
    // The decrypted string holds this device's other secrets, so it leaves the cache with the form.
    gcTime: 0,
    queryFn: () =>
      scope === 'details'
        ? null
        : connectionStringsCollection.utils.decrypt(connection.id),
    queryKey: ['connection', connection.id, 'unlock', scope],
  })
  const { mutateAsync } = useMutation({
    meta: { event: 'connection_password_saved' },
    mutationFn: async (saved: { connectionString: string }) => {
      await connectionStringsCollection.utils.save({
        connectionId: connection.id,
        connectionString: saved.connectionString,
        updatedAt: connection.updatedAt,
      })
      toast.success(scope === 'details' ? 'Details saved' : 'Credentials saved')
    },
  })

  if (connectionString === undefined) {
    return null
  }

  return (
    <ConnectionPage
      defaultValues={formValuesOf(connection, connectionString)}
      mode={editModeOf(
        connection,
        connectionStringsCollection.get(connection.id),
        scope
      )}
      persist={(saved) => mutateAsync(saved)}
    />
  )
}
