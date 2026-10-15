import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

import { mutateOffline, useCollections } from '~/core/collections'
import { ensureResource } from '~/core/connection/resources'
import { rememberOpenedResource } from '~/core/connection/stores'
import type { Connection } from '~/core/connection/sync'
import { ConnectionPage } from '~/modules/connection-form/components/connection-page'
import { formValuesOf } from '~/modules/connection-form/lib/connection-form'
import { editModeOf } from '~/modules/connection-form/lib/form-mode'

export const UnlockForm = ({
  connection,
  resourceName,
  scope,
}: {
  connection: Connection
  resourceName: string | null
  scope: 'credentials' | 'details'
}) => {
  const { connectionStringsCollection } = useCollections()
  const router = useRouter()
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
    meta: { event: `connection_${scope}_saved` },
    mutationFn: async (saved: { connectionString: string }) => {
      const { record } = await connectionStringsCollection.utils.save({
        connectionId: connection.id,
        connectionString: saved.connectionString,
        updatedAt: connection.updatedAt,
      })
      toast.success(scope === 'details' ? 'Details saved' : 'Credentials saved')
      const database = record.defaultResourceName
      if (scope === 'details' && database && database !== resourceName) {
        let resourceId = ''
        mutateOffline(() => {
          resourceId = ensureResource(connection.id, database)
        })
        rememberOpenedResource(connection.id, database)
        await router.navigate({
          params: { resourceId },
          to: '/connection/$resourceId',
        })
      }
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
      onSave={(saved) => mutateAsync(saved)}
    />
  )
}
