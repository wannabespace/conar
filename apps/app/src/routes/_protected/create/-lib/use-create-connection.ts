import { isSshConnectionString } from '@tamery/connection/utils'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

import { useCollections } from '~/core/collections'
import { createConnection } from '~/core/connection/create'
import { prefetchConnectionResourceCore } from '~/core/connection/fetching'
import { useActiveWorkspace } from '~/core/workspace/hooks'
import { posthog } from '~/lib/posthog'
import type { SavedConnection } from '~/modules/connection-form/lib/use-save-connection'

export const useCreateConnection = () => {
  const collections = useCollections()
  const { data: activeWorkspace } = useActiveWorkspace()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ open, origin, ...data }: SavedConnection) => {
      if (!activeWorkspace) {
        throw new Error('Workspace is still loading. Please try again.')
      }

      const { resourceId, tx } = await createConnection({
        ...data,
        workspaceId: activeWorkspace.id,
      })

      if (!window.electron && navigator.onLine) {
        await tx.isPersisted.promise
      }

      if (open) {
        const createdResource =
          collections.connectionsResourcesCollection.get(resourceId)
        if (!createdResource) {
          throw new Error('Connection resource not found after create')
        }
        prefetchConnectionResourceCore(createdResource)
        await router.navigate({
          params: { resourceId },
          to: '/connection/$resourceId',
        })
      } else {
        await router.navigate({ to: '/' })
      }
      posthog.capture('connection_created', {
        origin: origin ?? 'form',
        ssh: isSshConnectionString(data.connectionString),
        syncType: data.syncType,
        type: data.type,
      })
      toast.success('Connection created')
    },
  })
}
